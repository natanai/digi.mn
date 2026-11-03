const assert=require("node:assert/strict");
const {test}=require("node:test");
const {buildDemoOperations}=require("./preview-demo.cjs");

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

test("the player needs evidence before finding the alley",()=>{
  const original={};
  assert.equal(take("enter the service alley",original),null);
  const active=take("accept the bounty",original);
  assert.ok(active);
  assert.equal(take("enter the service alley",active.state),null);
  const vendor=take("ask the vendor",active.state);
  assert.ok(take("enter the service alley",vendor.state));
  const crate=take("examine the damaged crate",active.state);
  assert.ok(take("enter the service alley",crate.state));
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

test("typed commands cannot bypass presentation-based clue gates",()=>{
  for(const label of ["enter the service alley","offer to help them"]){
    const action=getAction(label);
    assert.deepEqual(action.choiceVisibleWhen,action.outcomes[0].condition,
      "A player must not bypass a clue merely by typing a hidden command");
  }
});

test("never replace authored or previously edited projects",()=>{
  for(const changed of [
    {...blank,revision:1},
    {...blank,nodes:[...blank.nodes,{id:"other"}]},
    {...blank,interactions:[{id:"other"}]},
  ])assert.deepEqual(buildDemoOperations(changed),[]);
});
