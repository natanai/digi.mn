const assert=require("node:assert/strict");
const {test}=require("node:test");
const {buildDemoOperations,buildCutawayUpgradeOperations}=require("./preview-demo.cjs");

const start="00000000-0000-4000-8000-000000000001";
const blank={revision:0,startNodeId:start,nodes:[{id:start,nodeNumber:1}],interactions:[]};
const fixture=()=>buildDemoOperations(blank);
function actions() {
  return fixture().filter(x=>x.type==="interaction.upsert").map(x=>x.interaction);
}
const getAction=(label)=> {
  const action=actions().find(x=>x.wording===label);
  assert.ok(action, "Missing authored command "+label);
  return action;
};
// A fixture-only logical walk of its declarative rules; the canonical
// runtime owns the actual evaluation and persistence at play time.
function conditionAllowed(condition, state) {
  switch(condition.type){
    case "always":return true;
    case "flag":return state[condition.key]===condition.value;
    case "not":return !conditionAllowed(condition.condition,state);
    case "all":return condition.conditions.every(x=>conditionAllowed(x,state));
    case "any":return condition.conditions.some(x=>conditionAllowed(x,state));
    default:throw Error("Unmodeled condition in preview fixture: "+condition.type);
  }
}
function take(label,state) {
  const action=getAction(label);
  if(!conditionAllowed(action.choiceVisibleWhen,state))return null;
  const outcome=action.outcomes.find(o=>conditionAllowed(o.condition,state));
  if(!outcome)return null;
  const next={...state};
  for(const effect of outcome.effects){
    if(effect.type==="set_flag")next[effect.key]=true;
    else if(effect.type==="clear_flag")next[effect.key]=false;
    else throw Error("Unmodeled effect in preview fixture: "+effect.type);
  }
  return {state:next,nodeId:outcome.after.find(s=>s.type==="transition")?.destination.nodeId??action.sourceNodeId};
}

test("first run has an editable, unique Cleaner scenario",()=>{
  const ops=fixture();
  const nodes=ops.filter(x=>x.type==="node.upsert");
  const inputs=actions();
  assert.equal(nodes.length,5);
  assert.ok(inputs.length>=10);
  assert.equal(nodes[0].node.id,start);
  assert.equal(new Set(nodes.map(x=>x.node.id)).size,nodes.length);
  assert.equal(new Set(inputs.map(x=>x.id)).size,inputs.length);
  assert.ok(inputs.every(x=>x.streetPlacement&&x.aliases.includes(x.wording)));
  assert.ok(inputs.every(x=>x.outcomes.every(o=>o.authorStatus==="configured")));
});

test("the alley remains visible but refuses travel until the player finds evidence",()=>{
  const active=take("accept the bounty",{});
  assert.ok(active);
  const door=getAction("enter the service alley");
  assert.equal(door.choiceVisibleWhen.type,"always","An unopened door must not visually disappear");
  const blocked=take("enter the service alley",active.state);
  assert.ok(blocked,"The player receives a response even without a clue");
  assert.equal(blocked.nodeId,door.sourceNodeId,"The player stays in the street");
  const vendor=take("ask the vendor",active.state);
  assert.notEqual(take("enter the service alley",vendor.state)?.nodeId,door.sourceNodeId);
  const crate=take("examine the damaged crate",active.state);
  assert.notEqual(take("enter the service alley",crate.state)?.nodeId,door.sourceNodeId);
});

test("the peaceful ending depends on listening and observing, never on violence",()=>{
  const active=take("accept the bounty",{});
  const clues=take("ask the vendor",active.state);
  const alley=take("enter the service alley",clues.state);
  assert.ok(alley);
  assert.equal(take("offer to help them",alley.state),null);
  const talk=take("ask what happened",alley.state);
  assert.equal(take("offer to help them",talk.state),null);
  const seen=take("look behind the box",talk.state);
  const peaceful=take("offer to help them",seen.state);
  assert.ok(peaceful,"The nonviolent outcome should be reachable after both clues");
  assert.match(JSON.stringify(peaceful.state),/resolved":true/);
  assert.equal(peaceful.state["digi.preview.case.paid"],false);
  assert.equal(peaceful.state["digi.preview.case.active"],false);
  const home=take("return to the office",peaceful.state);
  assert.ok(home);
  assert.equal(home.nodeId,start);
  assert.ok(take("accept the bounty",home.state),"The case should be replayable without resetting Author content");
});

test("paid resolution resolves the case independently of the empathy route",()=>{
  const entered=take("enter the service alley",
    take("examine the damaged crate",take("accept the bounty",{}).state).state);
  const paid=take("return the supplies to the client",entered.state);
  assert.ok(paid);
  assert.equal(paid.state["digi.preview.case.resolved"],true);
  assert.equal(paid.state["digi.preview.case.paid"],true);
  assert.equal(paid.state["digi.preview.case.active"],false);
});

test("typed commands cannot bypass story conditions even when a door remains visible",()=>{
  const door=getAction("enter the service alley");
  assert.equal(door.choiceVisibleWhen.type,"always");
  assert.notEqual(door.outcomes[0].condition.type,"always");
  assert.equal(door.outcomes.length,2,"Door has a locked response and an unlocked transition");
  assert.equal(door.outcomes[1].after.length,0);
  const help=getAction("offer to help them");
  assert.deepEqual(help.choiceVisibleWhen,help.outcomes[0].condition,
    "The nonviolent resolution must require insight even when entered by typing");
});

test("the visual cutaways are authored Media cues rather than a second cutscene runtime",()=>{
  const accepted=getAction("accept the bounty");
  const peaceful=getAction("offer to help them");
  const briefing=accepted.outcomes[0].responsePerformance.cues;
  const rescue=peaceful.outcomes[0].responsePerformance.cues;
  assert.equal(briefing.length,1);
  assert.equal(rescue.length,1);
  assert.equal(briefing[0].type,"sprite");
  assert.equal(rescue[0].type,"sprite");
  assert.equal(briefing[0].value,"digi.mn.cutaway.cleaner-briefing");
  assert.equal(rescue[0].value,"digi.mn.cutaway.alley-rescue");
  assert.ok(briefing[0].start < briefing[0].end);
  assert.ok(rescue[0].start < rescue[0].end);
  const paid=getAction("return the supplies to the client");
  assert.deepEqual(paid.outcomes[0].responsePerformance.cues,[],
    "The peaceful cutaway must not be shown on the paid resolution");
});

test("unmodified legacy demo gains art cues without changing any other narrative data",()=>{
  const old=fixture();
  const nodes=old.filter(entry=>entry.type==="node.upsert").map(entry=>entry.node);
  const interactions=old.filter(entry=>entry.type==="interaction.upsert").map(entry=>({
    ...entry.interaction,outcomes:entry.interaction.outcomes.map(outcome=>({
      ...outcome,responsePerformance:{...outcome.responsePerformance,cues:[]},
    })),
  }));
  const snapshot={...blank,revision:1,nodes,interactions};
  const changes=buildCutawayUpgradeOperations(snapshot);
  assert.equal(changes.length,2);
  for(const change of changes){
    const original=interactions.find(entry=>entry.id===change.interaction.id);
    const expectedCues=change.interaction.outcomes[0].responsePerformance.cues;
    assert.equal(expectedCues.length,1);
    const stripped={...change.interaction,outcomes:[{
      ...change.interaction.outcomes[0],
      responsePerformance:{...change.interaction.outcomes[0].responsePerformance,cues:[]},
    }]};
    assert.deepEqual(stripped,original,
      "The compatibility upgrade may only add a Media cue, not rewrite story content");
  }
  assert.deepEqual(buildCutawayUpgradeOperations({...snapshot,revision:2}),[],
    "Any later authored mutation means don't silently patch the project");
  assert.deepEqual(buildCutawayUpgradeOperations({...snapshot,interactions:[
    {...interactions[0],notes:"User edit"},...interactions.slice(1),
  ]}),[]);
  assert.deepEqual(buildCutawayUpgradeOperations({...snapshot,interactions:interactions.map(entry=>
    entry.wording==="offer to help them"?{...entry,notes:"Edited response"}:entry)}),[]);
});

test("never replace authored or previously edited projects",()=>{
  for(const changed of [
    {...blank,revision:1},
    {...blank,nodes:[...blank.nodes,{id:"other"}]},
    {...blank,interactions:[{id:"other"}]},
  ])assert.deepEqual(buildDemoOperations(changed),[]);
});
