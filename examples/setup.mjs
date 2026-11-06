// Run after npm run build. Creates a separate demo workspace under the requested path.
import {mkdir,copyFile,readFile} from 'node:fs/promises';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';import {Project} from '../dist/core.js';
const root=resolve(process.argv[2]??'demo-workspace');await mkdir(root,{recursive:true});const src=fileURLToPath(new URL('./task-app/',import.meta.url));
for(const f of ['tasks.mjs','check.mjs','requirements.md'])await copyFile(join(src,f),join(root,f));
const p=new Project(root);await p.init('Taskboard · ScopeLock demo');await p.import(await readFile(join(root,'requirements.md'),'utf8'));await p.confirm();
for(const [i,mode] of ['add','empty','complete','persistence'].entries())await p.defineCheck({id:'CHECK-00'+(i+1),title:mode,criteria:['REQ-00'+(i+1)+'-AC1'],command:process.execPath,args:['check.mjs',mode],cwd:'.',timeoutMs:10000});
console.log('Demo ready at '+root+'. Check definitions await your review and approval.');
