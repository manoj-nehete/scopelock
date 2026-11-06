export class Tasks {
 tasks=[];
 add(title){if(!title.trim())throw Error('Title required');const task={id:this.tasks.length+1,title,completed:false};this.tasks.push(task);return task;}
 complete(id){const task=this.tasks.find(t=>t.id===id);if(!task)throw Error('Unknown task');task.completed=true;}
 // Intentionally in-memory: persistence acceptance must fail until implemented.
}
