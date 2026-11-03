const assert=require("node:assert/strict");
const {test}=require("node:test");
const {buildDemoOperations}=require("./preview-demo.cjs");

const start="00000000-0000-4000-8000-000000000001";
const blank={revision:0,startNodeId:start,nodes:[{id:start,nodeNumber:1}],interactions:[]};
test("first run has an editable Cleaner demo and unique narrative identities",()=>{
  const ops=buildDemoOperations(blank);
  const nodes=ops.filter(x=>x.type==="node.upsert");
  const actions=ops.filter(x=>x.type==="interaction.upsert").map(x=>x.interaction);
  assert.equal(nodes.length,5);
  assert.ok(actions.length>=10);
  assert.equal(nodes[0].node.id,start);
  assert.equal(new Set(nodes.map(x=>x.node.id)).size,nodes.length);
  assert.equal(new Set(actions.map(x=>x.id)).size,actions.length);
  assert.ok(actions.every(x=>x.streetPlacement&&x.aliases.includes(x.wording)));
});
test("actual reachable nonviolent resolution and return path",()=>{
  const ops=buildDemoOperations(blank);
  const graph=new Map();
  for(const op of ops.filter(x=>x.type==="interaction.upsert")){
    const a=op.interaction;const target=a.outcomes.flatMap(o=>o.after.filter(s=>s.type==="transition").map(s=>s.destination.nodeId));
    graph.set(a.id,{from:a.sourceNodeId,to:target[0],label:a.wording});
  }
  const peaceful=[...graph.values()].find(x=>x.label==="offer to help them");
  assert.ok(peaceful?.to);
  const outgoing=[...graph.values()].filter(x=>x.from===peaceful.to);
  assert.ok(outgoing.some(x=>x.to===start));
  const reached=new Set([start]);let pending=[start];
  while(pending.length){const id=pending.shift();for(const edge of graph.values()){if(edge.from===id && edge.to && !reached.has(edge.to)){reached.add(edge.to);pending.push(edge.to);}}}
  assert.ok(reached.has(peaceful.to),"Peaceful ending must be reachable from the home Node");
});
test("never replace authored or previously edited projects",()=>{
  for(const changed of [
    {...blank,revision:1},
    {...blank,nodes:[...blank.nodes,{id:"other"}]},
    {...blank,interactions:[{id:"other"}]},
  ])assert.deepEqual(buildDemoOperations(changed),[]);
});
