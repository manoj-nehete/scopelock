import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const views=[
 'Overview',
 'Phases',
 'Requirements',
 'Checks & logs',
 'Evidence',
 'Activity',
 'Scope review',
 'Integrations',
 'Coverage',
 'Dependencies',
 'Impact & Drift',
 'Handoff',
 'Checkpoints',
 'Readiness'
];

function Badge({value}:{value:string}){
 return <span className={'badge '+(value||'not_checked')}>{String(value||'not_checked').replaceAll('_',' ')}</span>;
}

function App(){
 const [s,setS]=useState<any>(null);
 const [token,setToken]=useState('');
 const [view,setView]=useState('Overview');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [connected,setConnected]=useState(false);
 const [query,setQuery]=useState('');
 const [phase,setPhase]=useState('');
 const [result,setResult]=useState('');
 const [actor,setActor]=useState('');
 const [date,setDate]=useState('');
 const [selected,setSelected]=useState('');
 const [busy,setBusy]=useState(false);

 // Advanced feature states
 const [coverageFilter,setCoverageFilter]=useState('');
 const [saveFilterName,setSaveFilterName]=useState('');
 const [showFilterDialog,setShowFilterDialog]=useState(false);
 const [fromCkpt,setFromCkpt]=useState('');
 const [toCkpt,setToCkpt]=useState('current');
 const [diffResult,setDiffResult]=useState<any>(null);
 const [handoffCopied,setHandoffCopied]=useState(false);
 const [accessibleDeps,setAccessibleDeps]=useState(false);

 useEffect(()=>{
  let live=true;
  fetch('/api/state')
   .then(r=>r.json())
   .then(x=>{
    if(x.error)throw Error(x.error);
    if(live){setS(x.state);setToken(x.token);}
   })
   .catch(e=>setError(String(e)));
  const es=new EventSource('/api/events');
  es.onopen=()=>setConnected(true);
  es.onmessage=e=>{setS(JSON.parse(e.data));setConnected(true);};
  es.onerror=()=>setConnected(false);
  es.addEventListener('error-message',(e:any)=>setError(JSON.parse(e.data).error));
  return ()=>{live=false;es.close();};
 },[]);

 async function act(action:string,data:any={}){
  setError('');setNotice('');setBusy(true);
  try{
   const r=await fetch('/api/action',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-ScopeLock-Token':token},
    body:JSON.stringify({action,...data})
   });
   const x=await r.json();
   if(!r.ok||x.error)throw Error(x.error||'Request failed');
   setNotice(action==='probe'?x.result.note:action==='doctor'?JSON.stringify(x.result):'Saved · '+action.replace(/([A-Z])/g,' $1').toLowerCase());
   return x.result ?? true;
  }catch(e){
   setError(e instanceof Error?e.message:String(e));
   return false;
  }finally{
   setBusy(false);
  }
 }

 function submit(action:string,mapper:(f:FormData)=>any){
  return async(e:React.FormEvent<HTMLFormElement>)=>{
   e.preventDefault();
   const form=e.currentTarget;
   try{
    if(await act(action,mapper(new FormData(form))))form.reset();
   }catch(e){
    setError(String(e));
   }
  };
 }

 if(!s)return <main className="loading"><div className="brandmark">S</div><h1>Opening your project</h1><p>{error||'Loading scope and recorded evidence…'}</p></main>;

 const reqs=s.requirements.filter((r:any)=>{
  const matchesPhase=!phase||r.phase===phase;
  const matchesResult=!result||r.verification===result||(result==='blocked'&&r.implementation==='blocked');
  const matchesQuery=(`${r.id} ${r.title} ${r.blocker} ${(r.files??[]).join(' ')}`).toLowerCase().includes(query.toLowerCase());
  return matchesPhase&&matchesResult&&matchesQuery;
 });

 const current=s.phases.find((p:any)=>p.id===s.activePhase);
 const passed=s.requirements.filter((r:any)=>r.verification==='passed').length;
 const implemented=s.requirements.filter((r:any)=>r.implementation==='implemented').length;
 const failed=s.requirements.filter((r:any)=>r.verification==='failed').length;

 const filteredRuns=s.runs.filter((r:any)=>{
  const matchesPhase=!phase||s.checks.find((c:any)=>c.id===r.checkId)?.criteria.some((id:string)=>s.requirements.some((q:any)=>q.phase===phase&&q.criteria.some((c:any)=>c.id===id)));
  const matchesResult=!result||r.status===result;
  const matchesActor=!actor||r.actor===actor;
  const matchesDate=!date||r.start.slice(0,10)===date;
  const matchesQuery=(`${r.id} ${r.checkId} ${r.output}`).toLowerCase().includes(query.toLowerCase());
  return matchesPhase&&matchesResult&&matchesActor&&matchesDate&&matchesQuery;
 });

 const detail=s.requirements.find((r:any)=>r.id===selected);

 // Built-in and custom saved filters
 const applyFilter=(targetResult:string,targetView='Requirements',extraQuery='')=>{
  setView(targetView);
  setResult(targetResult);
  setQuery(extraQuery);
 };

 const filterbar=(
  <div className="filters-container">
   <div className="filter-pills">
    <span>Quick filters:</span>
    <button className={'filter-pill '+(result==='blocked'?'active':'')} onClick={()=>applyFilter('blocked','Requirements')}>Blocked work</button>
    <button className={'filter-pill '+(result==='failed'?'active':'')} onClick={()=>applyFilter('failed','Checks & logs')}>Failed checks</button>
    <button className={'filter-pill '+(result==='stale'?'active':'')} onClick={()=>applyFilter('stale','Evidence')}>Stale evidence</button>
    <button className={'filter-pill '+(result==='not_checked'?'active':'')} onClick={()=>applyFilter('not_checked','Requirements')}>Implemented unverified</button>
    {(s.savedFilters??[]).filter((f:any)=>!f.isBuiltin).map((f:any)=>(
     <span key={f.id} className="filter-pill custom" onClick={()=>{setView(f.target==='checks'?'Checks & logs':f.target==='evidence'?'Evidence':f.target==='activity'?'Activity':'Requirements');setResult(f.result);setPhase(f.phase);setQuery(f.query);}}>
      {f.name} <button type="button" style={{border:0,background:'none',cursor:'pointer',padding:'0 2px'}} onClick={(e)=>{e.stopPropagation();act('deleteFilter',{id:f.id});}}>×</button>
     </span>
    ))}
    <button className="button ghost" style={{padding:'4px 8px',fontSize:'11px'}} onClick={()=>setShowFilterDialog(!showFilterDialog)}>+ Save filter</button>
   </div>
   {showFilterDialog&&(
    <div className="card" style={{padding:'12px',marginBottom:'14px'}}>
     <form onSubmit={async(e)=>{e.preventDefault();if(!saveFilterName.trim())return;await act('saveFilter',{filter:{name:saveFilterName,target:view==='Checks & logs'?'checks':view==='Evidence'?'evidence':view==='Activity'?'activity':'requirements',query,phase,result,actor,date}});setSaveFilterName('');setShowFilterDialog(false);}}>
      <label>Filter name<input value={saveFilterName} onChange={e=>setSaveFilterName(e.target.value)} placeholder="e.g., P01 unverified" required/></label>
      <button className="button" disabled={busy}>Save</button>
      <button type="button" className="button ghost" onClick={()=>setShowFilterDialog(false)}>Cancel</button>
     </form>
    </div>
   )}
   <div className="filters">
    <input aria-label="Search records" placeholder="Search by ID, title, file or output…" value={query} onChange={e=>setQuery(e.target.value)}/>
    {view!=='Activity'&&(
     <select aria-label="Filter phase" value={phase} onChange={e=>setPhase(e.target.value)}>
      <option value="">All phases</option>
      {s.phases.map((p:any)=><option key={p.id} value={p.id}>{p.id}</option>)}
     </select>
    )}
    {view!=='Activity'&&(
     <select aria-label="Filter result" value={result} onChange={e=>setResult(e.target.value)}>
      <option value="">All results</option>
      {['not_checked','passed','failed','stale','blocked','running','cancelled','error'].map(x=><option key={x} value={x}>{x}</option>)}
     </select>
    )}
    {['Checks & logs','Activity','Evidence'].includes(view)&&(
     <>
      <select aria-label="Filter actor" value={actor} onChange={e=>setActor(e.target.value)}>
       <option value="">All reporters</option>
       {[...new Set(s.events.map((e:any)=>e.actor))].map((x:any)=><option key={x} value={x}>{x}</option>)}
      </select>
      <input aria-label="Filter date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
     </>
    )}
    {(query||phase||result||actor||date)&&(
     <button className="button ghost" onClick={()=>{setQuery('');setPhase('');setResult('');setActor('');setDate('');}}>Clear</button>
    )}
   </div>
  </div>
 );

 const table=(rows:any[])=>(
  <div className="table-wrap">
   <table>
    <thead>
     <tr><th>Requirement</th><th>Phase</th><th>Implementation</th><th>Verification</th></tr>
    </thead>
    <tbody>
     {rows.map(r=>(
      <tr key={r.id}>
       <td>
        <button className="textlink" onClick={()=>{setSelected(r.id);setView('Requirements');}}>
         {r.id} <strong>{r.title}</strong>
         {r.files?.length>0&&<small style={{display:'block',color:'#6b7c61'}}>{r.files.join(', ')}</small>}
        </button>
       </td>
       <td>{r.phase}</td>
       <td><Badge value={r.implementation}/></td>
       <td><Badge value={r.verification}/></td>
      </tr>
     ))}
    </tbody>
   </table>
   {!rows.length&&<p className="empty">No requirements match this view.</p>}
  </div>
 );

 return (
  <div className="shell">
   <aside>
    <div className="logo"><span className="brandmark">S</span>ScopeLock<span className="version">LOCAL</span></div>
    <div className="project-label">YOUR WORKSPACE</div>
    <div className="project-name">{s.name}</div>
    <nav aria-label="Main navigation">
     {views.map((v,i)=>(
      <button key={v} className={view===v?'active':''} onClick={()=>{setView(v);setSelected('');setQuery('');setResult('');setPhase('');}}>
       <span className="navnum">{String(i+1).padStart(2,'0')}</span>
       {v}
       {v==='Scope review'&&s.proposals.filter((p:any)=>p.status==='pending').length>0&&(
        <span className="count">{s.proposals.filter((p:any)=>p.status==='pending').length}</span>
       )}
      </button>
     ))}
    </nav>
    <div className="sidebar-foot">
     <span className={'dot '+(connected?'online':'')}/>
     {connected?'Live local updates':'Reconnecting…'}
     <small>Project data stays on this computer.</small>
    </div>
   </aside>

   <main>
    <header>
     <div className="breadcrumb">WORKSPACE <span>/</span> {view.toUpperCase()}</div>
     <div className="header-actions">
      <span className="revision">Scope v{s.scopeRevision}</span>
      <a className="button ghost" href="/api/report">Export report ↗</a>
     </div>
    </header>

    <section className="page">
     <div className="page-heading">
      <div>
       <p className="eyebrow">BUILD WITH EVIDENCE</p>
       <h1>{view==='Overview'?'A clear view of your build.':view}</h1>
       <p className="subtitle">
        {view==='Overview'?'Keep scope, implementation and verification in view.':'Track the work. Inspect the evidence. Know what comes next.'}
       </p>
      </div>
      <button className="button ghost" disabled={busy} onClick={()=>act('doctor')}>Project health</button>
     </div>

     {error&&<div role="alert" className="alert error">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
     {notice&&<div role="status" className="alert">{notice}<button onClick={()=>setNotice('')}>Dismiss</button></div>}
     {!s.confirmed&&<div className="alert warning">Scope is a draft. Review requirements before confirming.<button disabled={busy||!s.requirements.length} onClick={()=>act('confirm')}>Confirm reviewed scope</button></div>}

     {/* 1. OVERVIEW VIEW WITH 4 DISTINCT SUMMARIES */}
     {view==='Overview'&&(
      <>
       <div className="summary-grid">
        {/* SUMMARY 1: IMPLEMENTATION */}
        <div className="summary-card" onClick={()=>{setView('Requirements');setResult('');}}>
         <h3>1. Implementation</h3>
         <div className="big-count">{s.summaries?.implementation?.implemented??implemented} / {s.summaries?.implementation?.total??s.requirements.length}</div>
         <div className="stat-row"><span>Implemented:</span><strong>{s.summaries?.implementation?.implemented??implemented}</strong></div>
         <div className="stat-row"><span>In Progress:</span><strong>{s.summaries?.implementation?.in_progress??0}</strong></div>
         <div className="stat-row"><span>Blocked:</span><strong style={{color:'#a4493a'}}>{s.summaries?.implementation?.blocked??0}</strong></div>
         <div className="stat-row"><span>Not Started:</span><strong>{s.summaries?.implementation?.not_started??0}</strong></div>
         <small>{s.summaries?.implementation?.calculation??'Count of requirements by recorded implementation status field.'}</small>
        </div>

        {/* SUMMARY 2: VERIFICATION */}
        <div className="summary-card" onClick={()=>{setView('Requirements');setResult('passed');}}>
         <h3>2. Verification</h3>
         <div className="big-count" style={{color:'#346344'}}>{s.summaries?.verification?.passed??passed} / {s.summaries?.verification?.total??s.requirements.length}</div>
         <div className="stat-row"><span>Passed (Fresh):</span><strong>{s.summaries?.verification?.passed??passed}</strong></div>
         <div className="stat-row"><span>Stale Evidence:</span><strong style={{color:'#947427'}}>{s.summaries?.verification?.stale??0}</strong></div>
         <div className="stat-row"><span>Failed:</span><strong style={{color:'#a4493a'}}>{s.summaries?.verification?.failed??failed}</strong></div>
         <div className="stat-row"><span>Not Checked:</span><strong>{s.summaries?.verification?.not_checked??0}</strong></div>
         <small>{s.summaries?.verification?.calculation??'Derived from freshness of criteria evidence matching current code fingerprint.'}</small>
        </div>

        {/* SUMMARY 3: BLOCKERS */}
        <div className="summary-card" onClick={()=>{setView('Requirements');setResult('blocked');}}>
         <h3>3. Blockers</h3>
         <div className="big-count" style={{color:s.summaries?.blockers?.total>0?'#a4493a':'#20352e'}}>{s.summaries?.blockers?.total??0}</div>
         <div className="stat-row"><span>Blocked Req items:</span><strong>{s.summaries?.blockers?.blockedRequirements?.length??0}</strong></div>
         <div className="stat-row"><span>Blocked Phases:</span><strong>{s.summaries?.blockers?.blockedPhases?.length??0}</strong></div>
         <div className="stat-row"><span>Failed Check Runs:</span><strong>{s.summaries?.blockers?.failedChecks?.length??0}</strong></div>
         <small>{s.summaries?.blockers?.calculation??'Active requirement blockers, phases with unmet prerequisite exit gates, and failed runs.'}</small>
        </div>

        {/* SUMMARY 4: RELEASE READINESS */}
        <div className="summary-card" onClick={()=>setView('Readiness')}>
         <h3>4. Release Readiness</h3>
         <div className="big-count" style={{color:s.summaries?.readiness?.status==='ready'?'#346344':'#8b712a'}}>
          {s.summaries?.readiness?.status?.toUpperCase()??'IN PROGRESS'}
         </div>
         <div className="stat-row"><span>Gates Passed:</span><strong>{s.summaries?.readiness?.gatesPassed??0} / {s.summaries?.readiness?.totalGates??s.phases.length}</strong></div>
         <div className="stat-row"><span>Unmet Exit Gates:</span><strong>{s.summaries?.readiness?.unmetGates?.length??0}</strong></div>
         <div className="stat-row"><span>Status:</span><Badge value={s.summaries?.readiness?.status??'in_progress'}/></div>
         <small>{s.summaries?.readiness?.calculation??'Audited exit criteria across all defined phases, requiring passing empirical evidence.'}</small>
        </div>
       </div>

       <div className="two-col">
        <article className="card current">
         <div className="section-label">ACTIVE PHASE <span>{current?.id??'DRAFT'}</span></div>
         <h2>{current?.title??'Start with your requirements'}</h2>
         <p>{current?.goal??'Import a Markdown requirements file to build your project roadmap.'}</p>
         <div className="progress-label"><span>Implementation</span><span>{implemented} / {s.requirements.length}</span></div>
         <progress value={implemented} max={s.requirements.length||1}/>
         <div className="progress-label"><span>Verification</span><span>{passed} / {s.requirements.length}</span></div>
         <progress className="verification" value={passed} max={s.requirements.length||1}/>
         <button className="button" onClick={()=>setView('Phases')}>Open phase roadmap →</button>
        </article>
        <article className="card">
         <div className="section-label">RECENT ACTIVITY</div>
         {s.events.slice(-5).reverse().map((e:any)=>(
          <div className="activity-mini" key={e.id}>
           <span className="activity-dot"/>
           <div>
            <strong>{e.type.replaceAll('_',' ')}</strong>
            <p>{e.detail}</p>
           </div>
           <time>{new Date(e.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>
          </div>
         ))}
        </article>
       </div>
       <section className="card">
        <div className="section-title">
         <h2>Requirements at a glance</h2>
         <button className="textlink" onClick={()=>setView('Requirements')}>View all →</button>
        </div>
        {table(s.requirements.slice(0,8))}
       </section>
      </>
     )}

     {/* 2. PHASES */}
     {view==='Phases'&&(
      <>
       <div className="phase-list">
        {s.phases.map((p:any,i:number)=>(
         <article className={'card phase-card '+(p.id===s.activePhase?'selected':'')} key={p.id}>
          <div className="phase-index">{String(i+1).padStart(2,'0')}</div>
          <div className="phase-content">
           <div className="section-label">{p.id}{p.id===s.activePhase&&<span>ACTIVE</span>}</div>
           <h2>{p.title}</h2>
           <p>{p.goal}</p>
           <div className="badges"><Badge value={p.implementation}/><Badge value={p.verification}/><span>{p.requirements.length} requirements</span></div>
           <p className="muted">Depends on: {p.dependencies.join(', ')||'No earlier phases'}</p>
           <details>
            <summary>Exit criteria and requirements</summary>
            {s.requirements.filter((r:any)=>r.phase===p.id).map((r:any)=>(
             <div key={r.id} className="criterion">
              <button className="textlink" onClick={()=>{setView('Requirements');setSelected(r.id);}}>
               {r.id} · {r.title}
              </button>
              {r.criteria.map((c:any)=><p key={c.id}><Badge value={s.criteria[c.id]?.status??'not_checked'}/> {c.text}</p>)}
             </div>
            ))}
           </details>
           {s.overrides.filter((o:any)=>o.phase===p.id).map((o:any,idx:number)=>(
            <p className="override" key={idx}>Continuation override: {o.reason}</p>
           ))}
           <form onSubmit={submit('activate',f=>({id:p.id,reason:String(f.get('reason')||'')||undefined}))}>
            <input name="reason" placeholder="Override reason, only if dependencies are unmet" aria-label={'Override reason for '+p.id}/>
            <button className="button ghost" disabled={busy||p.id===s.activePhase}>Activate phase</button>
           </form>
          </div>
         </article>
        ))}
       </div>
       {!s.phases.length&&<p className="empty">Import requirements to define phases.</p>}
      </>
     )}

     {/* 3. REQUIREMENTS */}
     {view==='Requirements'&&(
      <>
       {filterbar}
       {table(reqs)}
       {detail&&(
        <article className="card detail">
         <div className="section-title">
          <h2>{detail.id} · {detail.title}</h2>
          <button onClick={()=>setSelected('')} className="button ghost">Close</button>
         </div>
         <p>Source line {detail.sourceLine} · Dependencies: {detail.dependencies.join(', ')||'None'}</p>
         {detail.files?.length>0&&(
          <p><strong>Linked files:</strong> {detail.files.join(', ')}</p>
         )}
         {detail.criteria.map((c:any)=>(
          <div className="criterion" key={c.id}>
           <div><code>{c.id}</code> <Badge value={s.criteria[c.id]?.status??'not_checked'}/></div>
           <p>{c.text}</p>
           <small>{c.kind==='manual'?'Requires human verification':'Requires an approved automated check'} · {s.criteria[c.id]?.origin??'No evidence'}</small>
          </div>
         ))}
         <form onSubmit={submit('update',f=>({id:detail.id,status:f.get('status'),blocker:f.get('blocker')}))}>
          <label>Implementation
           <select name="status" defaultValue={detail.implementation}>
            {['not_started','in_progress','implemented','blocked'].map(x=><option key={x} value={x}>{x}</option>)}
           </select>
          </label>
          <label>Blocker reason<input name="blocker" defaultValue={detail.blocker}/></label>
          <button disabled={busy} className="button">Save implementation</button>
         </form>
         <details><summary>Original source</summary><pre>{s.source}</pre></details>
        </article>
       )}
      </>
     )}

     {/* 4. CHECKS & LOGS */}
     {view==='Checks & logs'&&(
      <>
       {filterbar}
       <section className="card">
        <div className="section-title"><h2>Check definitions</h2><span>Commands require explicit review</span></div>
        {s.checks.map((c:any)=>(
         <div className="check-row" key={c.id}>
          <div>
           <strong>{c.id} · {c.title}</strong>
           <pre>{JSON.stringify([c.command,...c.args])}</pre>
           <small>{c.criteria.join(', ')} · timeout {c.timeoutMs/1000}s · cwd {c.cwd}</small>
          </div>
          <div>
           <Badge value={c.approved?'passed':'not_checked'}/>
           <button disabled={busy} className="button ghost" onClick={()=>act(c.approved?'run':'approveCheck',{id:c.id})}>
            {c.approved?'Run check':'Approve command'}
           </button>
          </div>
         </div>
        ))}
        {!s.checks.length&&<p className="empty">Define a check and review its exact command before running it.</p>}
        <details>
         <summary>Add check definition</summary>
         <form onSubmit={submit('defineCheck',f=>({check:JSON.parse(String(f.get('check')))}))}>
          <label>Check JSON<textarea name="check" rows={9} required defaultValue={JSON.stringify({id:'CHECK-001',title:'Example check',criteria:[s.requirements[0]?.criteria[0]?.id??'REQ-001-AC1'],command:'node',args:['--version'],cwd:'.',timeoutMs:30000},null,2)}/></label>
          <p className="muted">Choose a command that actually tests the linked criterion. A process exit alone cannot prove broader correctness.</p>
          <button className="button" disabled={busy}>Save for review</button>
         </form>
        </details>
       </section>

       <h2 className="space-heading">Run history</h2>
       {filteredRuns.slice().reverse().map((r:any)=>(
        <article className="card run" key={r.id}>
         <div className="section-title">
          <div>
           <h3>{r.checkId}</h3>
           <small>{r.id} · {r.actor} · {new Date(r.start).toLocaleString()}</small>
          </div>
          <Badge value={r.status}/>
         </div>
         <p>Duration: {((new Date(r.end??Date.now()).getTime()-new Date(r.start).getTime())/1000).toFixed(1)}s · Exit: {r.exitCode??'—'}</p>
         {r.reason&&<p className="override">{r.reason}</p>}
         <details open={r.status==='running'||r.status==='failed'}>
          <summary>Inspect output</summary>
          <pre className="terminal">{r.output||'Waiting for output…'}</pre>
         </details>
         {r.status==='running'&&<button className="button ghost" onClick={()=>act('cancel',{id:r.id})}>Cancel run</button>}
        </article>
       ))}
       {!filteredRuns.length&&<p className="empty">No matching runs yet.</p>}
       <details className="card">
        <summary>Log retention</summary>
        <form onSubmit={submit('clearLogs',f=>({days:Number(f.get('days'))}))}>
         <label>Retain days (1–365)<input name="days" defaultValue={String(s.retentionDays)} type="number" required/></label>
         <button className="button ghost">Apply retention</button>
        </form>
        <button className="textlink" onClick={()=>{if(confirm('Clear stored output for finished runs? Result metadata will remain.'))act('clearLogs');}}>
         Clear all finished-run output
        </button>
       </details>
      </>
     )}

     {/* 5. EVIDENCE */}
     {view==='Evidence'&&(
      <>
       {filterbar}
       <section className="card">
        <h2>Record a human verification</h2>
        <p>Use this after personally checking a manual acceptance criterion.</p>
        <form onSubmit={submit('evidence',f=>({criterion:f.get('criterion'),result:f.get('result'),note:f.get('note'),artifact:String(f.get('artifact')||'')||undefined}))}>
         <label>Criterion
          <select name="criterion" required>
           {s.requirements.flatMap((r:any)=>r.criteria.filter((c:any)=>c.kind==='manual').map((c:any)=><option key={c.id} value={c.id}>{c.id} · {c.text}</option>))}
          </select>
         </label>
         <label>Result
          <select name="result">
           <option value="passed">Passed</option>
           <option value="failed">Failed</option>
          </select>
         </label>
         <label>What did you observe?<input name="note" placeholder="Describe the actual steps and result" required/></label>
         <label>Optional artifact path inside project<input name="artifact" placeholder="evidence/screenshot.png"/></label>
         <button className="button" disabled={busy}>Record my verification</button>
        </form>
       </section>

       {s.evidence
        .filter((e:any)=>(!phase||s.requirements.some((r:any)=>r.phase===phase&&r.criteria.some((c:any)=>c.id===e.criterion)))&&(!actor||e.actor===actor)&&(!date||e.time.slice(0,10)===date)&&(!result||e.result===result)&&(`${e.criterion} ${e.note}`).toLowerCase().includes(query.toLowerCase()))
        .slice().reverse().map((e:any)=>(
         <article className="card" key={e.id}>
          <div className="section-title"><h3>{e.criterion}</h3><Badge value={e.result}/></div>
          <p>{e.note}</p>
          <small>{e.origin} evidence · {e.actor} · {new Date(e.time).toLocaleString()}</small>
          {e.origin==='agent'&&<p className="muted">Agent-reported evidence does not satisfy a human verification criterion.</p>}
          {e.artifact&&<p>Artifact: <a href={'/api/artifact?id='+encodeURIComponent(e.id)}>Download evidence file</a></p>}
         </article>
        ))}
      </>
     )}

     {/* 6. ACTIVITY / TIMELINE */}
     {view==='Activity'&&(
      <>
       {filterbar}
       <section className="card timeline">
        {s.events
         .filter((e:any)=>(!actor||e.actor===actor)&&(!date||e.time.slice(0,10)===date)&&(`${e.type} ${e.detail} ${e.requirement??''} ${e.phase??''}`).toLowerCase().includes(query.toLowerCase()))
         .slice().reverse().map((e:any)=>(
          <div className="timeline-row" key={e.id}>
           <time>{new Date(e.time).toLocaleString()}</time>
           <div>
            <strong>{e.type.replaceAll('_',' ')}</strong>
            <p>{e.detail}</p>
            {(e.requirement||e.phase)&&<small style={{color:'#65795c'}}>Scope: {e.phase?`Phase ${e.phase}`:''} {e.requirement?`[${e.requirement}]`:''}</small>}
           </div>
           <span>{e.actor}</span>
           <code>r{e.revision}</code>
          </div>
         ))}
       </section>
      </>
     )}

     {/* 7. SCOPE REVIEW */}
     {view==='Scope review'&&(
      <>
       <section className="card">
        <h2>{s.confirmed?'Propose a scope change':'Import requirements'}</h2>
        <p>Use explicit phase headings, requirement IDs, and acceptance criteria. The original text is retained.</p>
        <form onSubmit={submit(s.confirmed?'propose':'import',f=>({source:f.get('source'),reason:f.get('reason')}))}>
         <label>Requirements Markdown<textarea name="source" rows={12} required defaultValue={s.source||'# Phase P01: Foundation\n## REQ-001: Example requirement\n- Acceptance: A measurable result\n'}/></label>
         {s.confirmed&&<label>Reason for change<input name="reason" placeholder="Why is this change necessary?" required/></label>}
         <button className="button" disabled={busy}>{s.confirmed?'Submit proposal':'Import draft'}</button>
        </form>
       </section>
       {s.proposals.slice().reverse().map((p:any)=>(
        <article className="card" key={p.id}>
         <div className="section-title"><h3>{p.reason}</h3><Badge value={p.status}/></div>
         <p>Based on scope v{p.baseScope}</p>
         <div className="two-col">
          <details><summary>Current source</summary><pre>{s.source}</pre></details>
          <details><summary>Proposed source</summary><pre>{p.source}</pre></details>
         </div>
         {p.status==='pending'&&(
          <div className="actions">
           <button className="button" disabled={busy} onClick={()=>act('decide',{id:p.id,accept:true})}>Accept scope change</button>
           <button className="button ghost" disabled={busy} onClick={()=>act('decide',{id:p.id,accept:false})}>Reject</button>
          </div>
         )}
        </article>
       ))}
      </>
     )}

     {/* 8. INTEGRATIONS */}
     {view==='Integrations'&&(
      <>
       <p className="muted">Configuration and local connection checks are shown separately. A successful probe does not prove a live session inside the agent.</p>
       <div className="integration-grid">
        {[['claude-code','Claude Code','CLAUDE.md + project MCP'],['codex','Codex','AGENTS.md + project TOML'],['antigravity','Antigravity','Workspace rules + MCP']].map(([id,title,desc])=>{
         const a=s.integrations[id];
         return (
          <article className="card integration" key={id}>
           <div className="agent-icon">{title[0]}</div>
           <h2>{title}</h2>
           <p>{desc}</p>
           <Badge value={a?.installed?'configured':'not_configured'}/>
           <dl>
            <dt>Last local probe</dt><dd>{a?.lastCheck?new Date(a.lastCheck).toLocaleString():'Not checked'}</dd>
            <dt>Last recorded session</dt><dd>{a?.lastActivity?new Date(a.lastActivity).toLocaleString():'No recorded activity'}</dd>
           </dl>
           <button disabled={busy} className="button" onClick={()=>act('connect',{agent:id,remove:!!a?.installed})}>
            {a?.installed?'Remove integration':'Set up integration'}
           </button>
           <button disabled={busy||!a?.installed} className="button ghost" onClick={()=>act('probe',{agent:id})}>
            Check local connection
           </button>
          </article>
         );
        })}
       </div>
      </>
     )}

     {/* 9. FEATURE A: COVERAGE MAP */}
     {view==='Coverage'&&(
      <>
       <div className="notice-box">
        <strong>Verification Boundary Notice:</strong> Linked files, passing checks, and recorded evidence indicate tracking coverage; they do not automatically prove semantic correctness or completeness.
       </div>
       <div className="metrics">
        <article className="metric" style={{cursor:'pointer'}} onClick={()=>setCoverageFilter('')}>
         <span>Total Requirements</span><strong>{s.requirements.length}</strong><small>Agreed work items</small>
        </article>
        <article className="metric" style={{cursor:'pointer'}} onClick={()=>setCoverageFilter('missingFiles')}>
         <span>Missing Files</span><strong>{s.requirements.filter((r:any)=>!r.files||r.files.length===0).length}</strong><small>No linked files</small>
        </article>
        <article className="metric" style={{cursor:'pointer'}} onClick={()=>setCoverageFilter('missingChecks')}>
         <span>Missing Checks</span><strong>{s.requirements.filter((r:any)=>r.criteria.some((c:any)=>c.kind==='automated')&&!s.checks.some((chk:any)=>chk.criteria.some((id:string)=>r.criteria.some((c:any)=>c.id===id)))).length}</strong><small>No automated tests</small>
        </article>
        <article className="metric" style={{cursor:'pointer'}} onClick={()=>setCoverageFilter('implementedUnverified')}>
         <span>Implemented Unverified</span><strong>{s.requirements.filter((r:any)=>r.implementation==='implemented'&&r.verification!=='passed').length}</strong><small>Needs verification</small>
        </article>
       </div>
       {coverageFilter&&(
        <div style={{marginBottom:'14px'}}>
         <span>Showing filter: <strong>{coverageFilter}</strong> </span>
         <button className="button ghost" style={{padding:'3px 8px',fontSize:'11px'}} onClick={()=>setCoverageFilter('')}>Clear filter</button>
        </div>
       )}
       <div className="table-wrap">
        <table>
         <thead>
          <tr><th>Requirement</th><th>Phase</th><th>Files</th><th>Checks</th><th>Evidence</th><th>Status</th></tr>
         </thead>
         <tbody>
          {s.requirements
           .filter((r:any)=>{
            if(coverageFilter==='missingFiles')return !r.files||r.files.length===0;
            if(coverageFilter==='missingChecks')return r.criteria.some((c:any)=>c.kind==='automated')&&!s.checks.some((chk:any)=>chk.criteria.some((id:string)=>r.criteria.some((c:any)=>c.id===id)));
            if(coverageFilter==='implementedUnverified')return r.implementation==='implemented'&&r.verification!=='passed';
            return true;
           })
           .map((r:any)=>{
            const chks=s.checks.filter((c:any)=>c.criteria.some((id:string)=>r.criteria.some((crit:any)=>crit.id===id)));
            const ev=s.evidence.filter((e:any)=>r.criteria.some((crit:any)=>crit.id===e.criterion));
            return (
             <tr key={r.id}>
              <td><button className="textlink" onClick={()=>{setSelected(r.id);setView('Requirements');}}>{r.id} <strong>{r.title}</strong></button></td>
              <td>{r.phase}</td>
              <td>{r.files?.length?r.files.join(', '):<span style={{color:'#a4493a'}}>None linked</span>}</td>
              <td>{chks.length?chks.map((c:any)=>c.id).join(', '):<span style={{color:'#a4493a'}}>None linked</span>}</td>
              <td>{ev.length} records</td>
              <td><Badge value={r.implementation}/> <Badge value={r.verification}/></td>
             </tr>
            );
           })}
         </tbody>
        </table>
       </div>
      </>
     )}

     {/* 10. FEATURE B: DEPENDENCY GRAPH */}
     {view==='Dependencies'&&(
      <>
       <div className="notice-box">
        <strong>Dependency Flow:</strong> Visualizing phase and requirement prerequisites, blockers, and eligible work items.
        <button className="button ghost" style={{marginLeft:'14px',padding:'4px 8px'}} onClick={()=>setAccessibleDeps(!accessibleDeps)}>
         {accessibleDeps?'Show Card View':'Show Accessible Text List'}
        </button>
       </div>

       {accessibleDeps?(
        <section className="card">
         <h2>Accessible Dependency Breakdown</h2>
         <h3>Phases</h3>
         <ul>
          {s.phases.map((p:any)=>{
           const unmet=p.dependencies.filter((d:string)=>s.phases.find((x:any)=>x.id===d)?.verification!=='passed');
           return <li key={p.id}>{p.id} ({p.title}): {unmet.length?`BLOCKED by unmet dependencies: ${unmet.join(', ')}`:`ELIGIBLE / Status: ${p.verification}`}</li>;
          })}
         </ul>
         <h3>Requirements</h3>
         <ul>
          {s.requirements.map((r:any)=>{
           const unmet=r.dependencies.filter((d:string)=>s.requirements.find((x:any)=>x.id===d)?.verification!=='passed');
           const isBlocked=r.implementation==='blocked'||unmet.length>0;
           return <li key={r.id}>{r.id} [Phase {r.phase}] ({r.title}): {isBlocked?`BLOCKED (${r.blocker||'Unmet prereqs: '+unmet.join(', ')})`:r.implementation==='implemented'?'IMPLEMENTED':`ELIGIBLE TO START`}</li>;
          })}
         </ul>
        </section>
       ):(
        <>
         <h2>Phase Dependencies</h2>
         <div className="two-col" style={{marginBottom:'24px'}}>
          {s.phases.map((p:any)=>{
           const unmet=p.dependencies.filter((d:string)=>s.phases.find((x:any)=>x.id===d)?.verification!=='passed');
           const isBlocked=unmet.length>0;
           return (
            <div className={'tree-node '+(isBlocked?'blocked':'eligible')} key={p.id}>
             <div className="section-title">
              <h3>{p.id}: {p.title}</h3>
              <Badge value={p.verification}/>
             </div>
             <p className="muted">Goal: {p.goal}</p>
             <p>Prerequisites: {p.dependencies.length?p.dependencies.join(', '):'None (Base phase)'}</p>
             {isBlocked&&<p className="override">Blocked by unverified: {unmet.join(', ')}</p>}
            </div>
           );
          })}
         </div>

         <h2>Requirement Dependency Status</h2>
         <div>
          {s.requirements.map((r:any)=>{
           const unmet=r.dependencies.filter((d:string)=>s.requirements.find((x:any)=>x.id===d)?.verification!=='passed');
           const isBlocked=r.implementation==='blocked'||unmet.length>0;
           const isEligible=r.implementation!=='implemented'&&!isBlocked;
           return (
            <div className={'tree-node '+(isBlocked?'blocked':isEligible?'eligible':'')} key={r.id}>
             <div className="section-title">
              <div>
               <strong>{r.id}: {r.title}</strong>
               <small style={{marginLeft:'10px'}}>Phase {r.phase}</small>
              </div>
              <div>
               {isEligible&&<span className="badge passed" style={{marginRight:'8px'}}>Eligible to Start</span>}
               <Badge value={r.implementation}/> <Badge value={r.verification}/>
              </div>
             </div>
             <p className="muted">Depends on: {r.dependencies.length?r.dependencies.join(', '):'None'}</p>
             {r.blocker&&<p className="override">Blocker reason: {r.blocker}</p>}
             {unmet.length>0&&<p className="override">Prerequisites unverified: {unmet.join(', ')}</p>}
            </div>
           );
          })}
         </div>
        </>
       )}
      </>
     )}

     {/* 11. FEATURES C & G: CHANGE-IMPACT TRACKING & SCOPE-DRIFT REVIEW */}
     {view==='Impact & Drift'&&(
      <>
       <div className="notice-box">
        <strong>Review Heuristics:</strong> Change-impact tracking flags affected evidence when linked files change. Scope-drift review highlights unlinked workspace files. These are human review heuristics; ScopeLock never automatically rejects edits or alters scope.
       </div>

       <h2>Scope-Drift Review (Unlinked Workspace Files)</h2>
       <p className="muted">Files in the workspace not declared in any requirement or documented as supporting infrastructure.</p>
       <section className="card">
        {s.supportingFiles?.length>0&&(
         <details style={{marginBottom:'16px'}}>
          <summary>Documented supporting infrastructure ({s.supportingFiles.length})</summary>
          <ul>
           {s.supportingFiles.map((sf:any)=><li key={sf.path}><code>{sf.path}</code> — {sf.reason}</li>)}
          </ul>
         </details>
        )}
        <div className="table-wrap">
         <table>
          <thead>
           <tr><th>Unlinked Path / Action</th><th>Link to Requirement</th><th>Document as Infrastructure</th></tr>
          </thead>
          <tbody>
           {/* Allow user to link or document files */}
           <tr>
            <td>
             <input id="newFilePath" placeholder="path/to/unlinked-file.ts" style={{width:'100%'}}/>
            </td>
            <td>
             <form onSubmit={async(e)=>{e.preventDefault();const f=e.currentTarget;const file=(document.getElementById('newFilePath') as HTMLInputElement)?.value;const req=(f.elements.namedItem('req') as HTMLSelectElement)?.value;if(file&&req){await act('linkFile',{requirement:req,file});}}}>
              <select name="req">
               {s.requirements.map((r:any)=><option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}
              </select>
              <button className="button ghost" style={{marginLeft:'8px'}}>Link file</button>
             </form>
            </td>
            <td>
             <form onSubmit={async(e)=>{e.preventDefault();const f=e.currentTarget;const file=(document.getElementById('newFilePath') as HTMLInputElement)?.value;const reason=(f.elements.namedItem('reason') as HTMLInputElement)?.value;if(file&&reason){await act('addSupportingFile',{file,reason});}}}>
              <input name="reason" placeholder="Reason (e.g., config, build)" required/>
              <button className="button ghost" style={{marginLeft:'8px'}}>Approve</button>
             </form>
            </td>
           </tr>
          </tbody>
         </table>
        </div>
       </section>

       <h2 className="space-heading">Change-Impact Tracking</h2>
       <section className="card">
        <p><strong>Working tree code fingerprint:</strong> <code>{s.fingerprint}</code></p>
        <p className="muted">Requirements with declared source files are checked against latest verified code states.</p>
        {s.requirements.filter((r:any)=>r.files?.length>0).map((r:any)=>(
         <div key={r.id} className="stat-row" style={{padding:'10px 0'}}>
          <div>
           <strong>{r.id}: {r.title}</strong>
           <div style={{color:'#65795c',fontSize:'11px'}}>Declared files: {r.files.join(', ')}</div>
          </div>
          <div>
           <Badge value={r.verification}/>
          </div>
         </div>
        ))}
       </section>
      </>
     )}

     {/* 12. FEATURE D: AGENT HANDOFF PANEL */}
     {view==='Handoff'&&(
      <>
       <div className="notice-box">
        <strong>Cross-Agent Continuity:</strong> Summarizes current task, active phase, blockers, and next steps across Claude Code, Codex, and Antigravity.
        <button className="button ghost" style={{marginLeft:'14px',padding:'4px 8px'}} onClick={()=>{navigator.clipboard?.writeText(document.getElementById('handoffText')?.innerText||'');setHandoffCopied(true);setTimeout(()=>setHandoffCopied(false),2000);}}>
         {handoffCopied?'Copied to Clipboard!':'Copy Handoff Markdown'}
        </button>
       </div>

       <div className="two-col">
        <section className="card">
         <div className="section-label">ACTIVE PHASE</div>
         <h2>{current?.id??'DRAFT'}: {current?.title??'Planning'}</h2>
         <p className="muted">{current?.goal??'No goal set'}</p>
         <hr style={{borderColor:'#eef1eb',margin:'16px 0'}}/>
         <h3>Current Task</h3>
         <p style={{fontSize:'14px',color:'#20352e'}}>
          {s.requirements.find((r:any)=>r.phase===s.activePhase&&r.verification!=='passed'&&r.implementation!=='blocked')?.title??'Review phase exit criteria'}
         </p>
         <h3>Recommended Next Action</h3>
         <p style={{fontSize:'13px',color:'#395647'}}>
          {s.requirements.some((r:any)=>r.implementation==='blocked')?`Resolve blockers on ${s.requirements.filter((r:any)=>r.implementation==='blocked').map((r:any)=>r.id).join(', ')}.`:'Implement next eligible requirement and execute approved verification check.'}
         </p>
        </section>

        <section className="card">
         <div className="section-label">RECORDED IMPLEMENTATION STATE</div>
         <div className="stat-row"><span>Total Requirements:</span><strong>{s.requirements.length}</strong></div>
         <div className="stat-row"><span>Implemented:</span><strong>{implemented}</strong></div>
         <div className="stat-row"><span>Verified (Passed):</span><strong>{passed}</strong></div>
         <div className="stat-row"><span>Blocked:</span><strong style={{color:'#a4493a'}}>{s.requirements.filter((r:any)=>r.implementation==='blocked').length}</strong></div>
         <hr style={{borderColor:'#eef1eb',margin:'16px 0'}}/>
         <h3>Active Blockers</h3>
         {s.requirements.filter((r:any)=>r.implementation==='blocked').length>0?(
          <ul>
           {s.requirements.filter((r:any)=>r.implementation==='blocked').map((r:any)=><li key={r.id}><strong>{r.id}</strong>: {r.blocker}</li>)}
          </ul>
         ):<p className="muted">No active blockers recorded.</p>}
        </section>
       </div>

       <section className="card">
        <h3>Handoff Markdown Export</h3>
        <pre id="handoffText" className="terminal" style={{maxHeight:'300px'}}>
{`# ScopeLock Agent Handoff
Project: ${s.name} · Scope v${s.scopeRevision} · Active Phase: ${s.activePhase??'Draft'}
Implementation: ${implemented} / ${s.requirements.length} · Verified: ${passed} / ${s.requirements.length}

## Active Phase
${current?.id??'P01'}: ${current?.title??'Implementation'}
Goal: ${current?.goal??''}

## Current Task & Next Action
${s.requirements.find((r:any)=>r.phase===s.activePhase&&r.verification!=='passed')?.id??'None'}: ${s.requirements.find((r:any)=>r.phase===s.activePhase&&r.verification!=='passed')?.title??'All verified'}

> Note: Agent claims and notes do not satisfy verification. All verifications require human attestation or approved check runs.`}
        </pre>
       </section>
      </>
     )}

     {/* 13. FEATURE F: CHECKPOINTS & COMPARISON */}
     {view==='Checkpoints'&&(
      <>
       <div className="notice-box">
        <strong>Persistent Checkpoints & Diff:</strong> Create named project baselines and compare two checkpoints to observe scope growth, verification shifts, and regressions.
       </div>

       <section className="card">
        <h2>Create Checkpoint</h2>
        <form onSubmit={submit('checkpoint',f=>({name:f.get('name'),note:f.get('note')}))}>
         <label>Checkpoint Name<input name="name" placeholder="e.g., Pre-refactor baseline" required/></label>
         <label>Note<input name="note" placeholder="Milestone description"/></label>
         <button className="button" disabled={busy}>Save Checkpoint</button>
        </form>
       </section>

       <section className="card">
        <h2>Compare Checkpoints</h2>
        <div style={{display:'flex',gap:'14px',alignItems:'flex-end',marginBottom:'18px'}}>
         <label>From Checkpoint
          <select value={fromCkpt} onChange={e=>setFromCkpt(e.target.value)}>
           <option value="">Select baseline…</option>
           {(s.checkpoints??[]).map((c:any)=><option key={c.id} value={c.id}>{c.name} ({new Date(c.time).toLocaleDateString()})</option>)}
          </select>
         </label>
         <label>To Checkpoint
          <select value={toCkpt} onChange={e=>setToCkpt(e.target.value)}>
           <option value="current">Current workspace state</option>
           {(s.checkpoints??[]).map((c:any)=><option key={c.id} value={c.id}>{c.name} ({new Date(c.time).toLocaleDateString()})</option>)}
          </select>
         </label>
         <button className="button ghost" disabled={!fromCkpt||busy} onClick={async()=>{
          const diff=await act('compareCheckpoints',{fromId:fromCkpt,toId:toCkpt});
          if(diff)setDiffResult(diff);
         }}>Compare</button>
        </div>

        {diffResult&&(
         <div className="diff-card">
          <h3>Comparison: {diffResult.fromCheckpoint?.name} → {diffResult.toCheckpoint?.name}</h3>
          <div style={{margin:'14px 0'}}>
           <div className="diff-metric">Scope Growth: <strong>{diffResult.metrics?.scopeGrowth?.delta>=0?'+':''}{diffResult.metrics?.scopeGrowth?.delta} items</strong></div>
           <div className="diff-metric">Implementation Progress: <strong>{diffResult.metrics?.implementationProgress?.delta>=0?'+':''}{diffResult.metrics?.implementationProgress?.delta} items</strong></div>
           <div className="diff-metric">Verification Progress: <strong>{diffResult.metrics?.verificationProgress?.delta>=0?'+':''}{diffResult.metrics?.verificationProgress?.delta} items</strong></div>
           <div className="diff-metric">Regressions: <strong style={{color:diffResult.metrics?.regressionsCount>0?'#a4493a':'#20352e'}}>{diffResult.metrics?.regressionsCount}</strong></div>
          </div>
          {diffResult.regressions?.length>0&&(
           <div className="alert error">
            Regressions detected: {diffResult.regressions.map((r:any)=>`${r.id} (${r.from} → ${r.to})`).join(', ')}
           </div>
          )}
          {diffResult.newBlockers?.length>0&&(
           <div className="alert warning">
            New blockers introduced: {diffResult.newBlockers.map((b:any)=>`${b.id}: ${b.blocker}`).join(', ')}
           </div>
          )}
         </div>
        )}
       </section>

       <h2>Saved Checkpoints</h2>
       {(s.checkpoints??[]).slice().reverse().map((c:any)=>(
        <article className="card" key={c.id}>
         <div className="section-title">
          <div>
           <h3>{c.name}</h3>
           <small>{c.id} · Scope v{c.scopeRevision} · {new Date(c.time).toLocaleString()}</small>
          </div>
          <span>by {c.actor}</span>
         </div>
         {c.note&&<p>{c.note}</p>}
        </article>
       ))}
       {!s.checkpoints?.length&&<p className="empty">No checkpoints created yet.</p>}
      </>
     )}

     {/* 14. FEATURE H: RELEASE-READINESS REPORT */}
     {view==='Readiness'&&(
      <>
       <div className="notice-box">
        <strong>Actionable Release Audit:</strong> Audits unresolved blockers, failed test runs, stale evidence, unmet phase gates, and target agent compatibility.
        <a className="button" style={{marginLeft:'14px',padding:'4px 10px'}} href="/api/readiness/report" download>
         Export Readiness Report ↗
        </a>
       </div>

       <div className="summary-card" style={{marginBottom:'22px'}}>
        <div className="section-title">
         <h2>Overall Release Status</h2>
         <Badge value={s.summaries?.readiness?.status==='ready'?'passed':'failed'}/>
        </div>
        <div className="metrics" style={{marginBottom:0}}>
         <article className="metric">
          <span>Implemented Reqs</span>
          <strong>{implemented} / {s.requirements.length}</strong>
         </article>
         <article className="metric">
          <span>Verified Reqs</span>
          <strong>{passed} / {s.requirements.length}</strong>
         </article>
         <article className="metric">
          <span>Verified Phase Gates</span>
          <strong>{s.summaries?.readiness?.gatesPassed??0} / {s.phases.length}</strong>
         </article>
         <article className="metric">
          <span>Active Blockers</span>
          <strong style={{color:(s.summaries?.blockers?.total??0)>0?'#a4493a':'#20352e'}}>{s.summaries?.blockers?.total??0}</strong>
         </article>
        </div>
       </div>

       <h2>Gate Findings & Action Items</h2>
       <section className="card">
        {s.summaries?.readiness?.unmetGates?.length>0?(
         <ul>
          {s.summaries.readiness.unmetGates.map((g:any)=>(
           <li key={g.id} style={{padding:'6px 0'}}>
            <strong>Phase {g.id} ({g.title}):</strong> Exit criteria status is <Badge value={g.verification}/>
           </li>
          ))}
         </ul>
        ):<p className="muted">All phase exit gates pass.</p>}

        {s.summaries?.blockers?.blockedRequirements?.length>0&&(
         <div style={{marginTop:'14px'}}>
          <h3>Unresolved Requirement Blockers</h3>
          <ul>
           {s.summaries.blockers.blockedRequirements.map((b:any)=>(
            <li key={b.id}><strong>{b.id} ({b.title}):</strong> {b.reason}</li>
           ))}
          </ul>
         </div>
        )}
       </section>
      </>
     )}

     <footer>
      ScopeLock · Local workspace <span>Implementation is a claim. Verification needs evidence.</span>
     </footer>
    </section>
   </main>
  </div>
 );
}

createRoot(document.getElementById('root')!).render(<App/>);
