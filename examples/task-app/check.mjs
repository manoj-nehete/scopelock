import assert from 'node:assert/strict';import {Tasks} from './tasks.mjs';
const tasks=new Tasks(),mode=process.argv[2];
if(mode==='add'){assert.equal(tasks.add('Read docs').title,'Read docs');console.log('Task creation passed');}
else if(mode==='empty'){assert.throws(()=>tasks.add(''));console.log('Empty title rejected');}
else if(mode==='complete'){const t=tasks.add('Read docs');tasks.complete(t.id);assert.equal(t.completed,true);console.log('Completion passed');}
else if(mode==='persistence'){tasks.add('Keep me');assert.equal(new Tasks().tasks.length,1,'Persistence intentionally missing');}
else throw Error('Unknown check');
