"use strict";

// A small editable sample project for first-time Windows preview installations.
// This is authored content, not a second narrative engine and not mission generation.
const id=(n)=>"d1910000-0000-4000-8000-"+String(n).padStart(12,"0");
const always={type:"always"};
const performance={charactersPerSecond:24,cues:[]};
const opening=(n,text)=>({
  id:id(100+n),order:0,condition:always,narrationText:text,dialogueText:"",
  narrationPerformance:performance,dialoguePerformance:performance,after:[],
});
const node=(n,name,description)=>({
  id:id(n), nodeNumber:n+1, authorLabel:name, openings:[opening(n,description)],
  ending:false,tags:["digi.mn","preview"],locationId:null,
  locationMode:"continue",conversationMode:"continue",conversationCharacterId:null,
  anchor:{mode:"continue",text:""},entryEffects:[],
});
const outcome=(n,text,to)=>({
  id:id(500+n),order:0,label:"default",authorStatus:"configured",
  condition:always,responseText:text,dialogueText:"",speakerId:null,
  responsePerformance:performance,dialoguePerformance:performance,
  effects:[], after:to?[{id:id(900+n),type:"transition",destination:{nodeId:to.id,openingId:null}}]:[],
});
const input=(n,from,label,kind,x,to,text)=>({
  id:id(300+n),sourceNodeId:from.id,order:n,wording:label,
  matchMode:"command",outcomeSelection:"first",choiceVisibility:"immediate",
  choiceVisibleWhen:always,streetPlacement:{kind,x,y:114},
  aliases:[label],tags:["preview"],notes:"",
  outcomes:[outcome(n,text,to)],
});
function buildDemoOperations(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.nodes) || snapshot.nodes.length!==1 ||
    !snapshot.startNodeId || !Array.isArray(snapshot.interactions) || snapshot.interactions.length ||
    snapshot.revision!==0) return [];
  const home={...node(0,"Cleaner home","The evening is still. Your Sapotama rests in your palm, displaying the same soft glow as everyone else's.\n\nA bounty notice is waiting on the counter. There is no quest log; you will have to remember what you learn."),id:snapshot.startNodeId,nodeNumber:snapshot.nodes[0].nodeNumber};
  const street=node(1,"South market street","A narrow market street opens before you. People are reluctant to say what happened to the missing supplies. Walk toward a person or object to investigate; open DISTRICT MAP to see connected streets.");
  const alley=node(2,"Service alley","The alley is quiet. A frightened creature is hiding beside a toppled delivery box. It is still listening.\n\nThis is a prototype encounter: the choices and consequences are text, not a separate combat minigame.");
  const peaceful=node(3,"Resolved without payment","You listen. The Digimon took the supplies to protect another injured creature. You help negotiate a safe return without forcing anyone into custody.\n\nThe client refuses the bounty payment, but the situation is resolved. You can return home.");
  const paid=node(4,"Resolved with payment","You persuade the Digimon to return the supplies directly to the client, without understanding what happened to the injured creature. The client pays your fee.\n\nYou have completed the assignment, but there may be consequences beyond the money.");
  const nodes=[home,street,alley,peaceful,paid];
  const interactions=[
    input(1,home,"accept the bounty","object",150,street,"You take the assignment. A report mentions missing deliveries near South Market."),
    input(2,street,"ask the vendor","person",148,null,"The vendor admits the Digimon looked frightened, not hostile. Something has been injured."),
    input(3,street,"examine the damaged crate","object",268,null,"The crate bears claw marks on the inside. Someone may have been trying to get out."),
    input(4,street,"enter the service alley","entrance",410,alley,"You leave the main street and follow the sound of rustling."),
    input(5,street,"return home","entrance",580,home,"You return to the Cleaner office. The case remains open."),
    input(6,alley,"ask what happened","person",144,null,"The Digimon lowers its guard. It says it was trying to save a hurt companion."),
    input(7,alley,"look behind the box","object",267,null,"You notice an improvised nest and an exhausted Digimon. The delivery was not random theft."),
    input(8,alley,"offer to help them","person",398,peaceful,"You choose to help resolve this without demanding a capture."),
    input(9,alley,"return the supplies to the client","object",540,paid,"You put the client's delivery ahead of the Digimon's explanation."),
    input(10,alley,"return to the market","entrance",650,street,"You retrace your steps to the market."),
    input(11,peaceful,"return to the office","entrance",156,home,"You head home without a payout. The case is complete."),
    input(12,paid,"return to the office","entrance",156,home,"You head home after collecting the fee. The case is complete."),
  ];
  return [
    ...nodes.map(node=>({type:"node.upsert",node})),
    ...interactions.map(interaction=>({type:"interaction.upsert",interaction})),
  ];
}

// For Windows preview: initialize only on the *untouched* first-run local DB.
// Imported project or later authored edits are never overwritten.
async function seedFirstRunDemo(miniflare,authorKey) {
  const endpoint="http://terminal.local";
  const send=async(path,options={})=>{
    const response=await miniflare.dispatchFetch(endpoint+path,options);
    const body=await response.text();
    if(!response.ok)throw new Error("Demo startup "+path+" failed ("+response.status+"): "+body.slice(0,400));
    return JSON.parse(body);
  };
  const snapshot=await send("/api/project/snapshot");
  const operations=buildDemoOperations(snapshot);
  if(!operations.length)return {seeded:false,reason:"Project already initialized or edited"};
  const login=await send("/api/author/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:authorKey})});
  const updated=await send("/api/author/mutate",{
    method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+login.token},
    body:JSON.stringify({expectedRevision:snapshot.revision,description:"Install digi.mn preview's editable Cleaner demo",operations}),
  });
  if(!updated.snapshot?.interactions?.some(x=>x.wording==="offer to help them"))throw new Error("Preview demo was not persisted");
  return {seeded:true,nodes:updated.snapshot.nodes.length,interactions:updated.snapshot.interactions.length};
}
module.exports={buildDemoOperations,seedFirstRunDemo};
