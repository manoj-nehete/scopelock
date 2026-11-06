import { spawn,type ChildProcess } from 'node:child_process';import { Project,fingerprint,within } from './core.js';import { now,uid } from './storage.js';
const children=new Map<string,ChildProcess>();
function terminate(child:ChildProcess){if(!child.pid)return;if(process.platform==='win32')spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true}).on('error',()=>child.kill('SIGKILL'));else try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}}
export function redact(text:string){return text.replace(/(api[_-]?key|token|password|secret|authorization)(["'\s:=]+)([^\s,"'}]+)/gi,'$1$2[REDACTED]').replace(/\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{8,}/g,'[REDACTED]').replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/g,'$1[REDACTED]@');}
export async function runCheck(project:Project,id:string,actor='human'){
 const state=await project.read(),check=state.checks.find(c=>c.id===id);if(!state.confirmed)throw Error('Confirm scope first');if(!check?.approved)throw Error('Check must be explicitly reviewed and approved');
 const cwd=await within(project.root,check.cwd),fp=await fingerprint(project.root),runId=uid('RUN');
 await project.mutate('check_started',actor,id,s=>{if(!s)throw Error('Missing project');const current=s.checks.find(c=>c.id===id);if(!current?.approved||JSON.stringify(current)!==JSON.stringify(check))throw Error('Check changed');s.runs.push({id:runId,checkId:id,status:'running',start:now(),fingerprint:fp,scopeRevision:state.scopeRevision,output:'',pid:process.pid,actor});return s;},state.revision);
 let raw='',timedOut=false,cancelled=false;const max=256*1024;let outputQueue=Promise.resolve();let lastFlush=0;
 const save=(final=false)=>{if(!final&&Date.now()-lastFlush<400)return;lastFlush=Date.now();const complete=final?raw:raw.slice(0,raw.lastIndexOf("\n")+1);const output=redact(complete);outputQueue=outputQueue.then(async()=>{await project.mutate('check_output',actor,runId,s=>{if(!s)throw Error('Missing project');s.runs.find(r=>r.id===runId)!.output=output;return s;});});};
 let code:number|null=null,error='';
 try{await new Promise<void>(resolve=>{
 const child=spawn(check.command,check.args,{cwd,shell:false,detached:process.platform!=='win32',windowsHide:true,stdio:['ignore','pipe','pipe']});children.set(runId,child);
 const timer=setTimeout(()=>{timedOut=true;terminate(child);},check.timeoutMs);
 child.stdout?.on('data',b=>{raw=(raw+b.toString()).slice(-max);save();});child.stderr?.on('data',b=>{raw=(raw+b.toString()).slice(-max);save();});
 child.on('error',e=>{error=e.message;});child.on('close',(exit,signal)=>{clearTimeout(timer);code=exit;cancelled=signal!==null&&!timedOut;children.delete(runId);resolve();});
 });}catch(e){error=String(e);}save(true);await outputQueue;
 const endFp=await fingerprint(project.root);return project.mutate('check_finished',actor,runId,s=>{if(!s)throw Error('Missing project');const r=s.runs.find(r=>r.id===runId)!;r.status=timedOut||error?'error':cancelled?'cancelled':code===0?'passed':'failed';r.end=now();r.exitCode=code;r.reason=error|| (timedOut?'Timed out':endFp!==fp?'Project changed during check; evidence is stale':undefined);return s;});
}
export function cancelRun(id:string){const child=children.get(id);if(!child)throw Error('Run is owned by another process or already finished');terminate(child);return {cancelled:id};}
export async function clearLogs(p:Project,days?:number){return p.mutate('logs_cleared','human','Log retention applied',s=>{if(!s)throw Error('Missing project');if(days!==undefined)s.retentionDays=days;const cutoff=days===undefined?Infinity:Date.now()-days*86400000;for(const r of s.runs)if(r.status!=='running'&&Date.parse(r.start)<cutoff)r.output='[Log cleared]';return s;});}
