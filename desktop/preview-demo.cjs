"use strict";

// A small editable sample project for first-time Windows preview installations.
// This is authored content, not a second narrative engine and not mission generation.
const id=(n)=>"d1910000-0000-4000-8000-"+String(n).padStart(12,"0");
const always={type:"always"};
const flag=(key,value=true)=>({type:"flag",key,value});
const not=(condition)=>({type:"not",condition});
const all=(...conditions)=>({type:"all",conditions});
const any=(...conditions)=>({type:"any",conditions});
const effect=(n,key,value=true)=>({id:id(1200+n),type:value?"set_flag":"clear_flag",key});
const CASE="digi.preview.case";
const BOUNTY_ACTIVE=CASE+".active";
const CASE_RESOLVED=CASE+".resolved";
const CASE_PAID=CASE+".paid";
const HEARD_VENDOR=CASE+".vendor";
const FOUND_CRATE=CASE+".crate";
const SPOKE_TO_DIGIMON=CASE+".talked";
const SAW_COMPANION=CASE+".injured";
const KNOWS_ALLEY=any(flag(HEARD_VENDOR),flag(FOUND_CRATE));
const UNDERSTANDS_SITUATION=all(flag(SPOKE_TO_DIGIMON),flag(SAW_COMPANION));
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
const outcome=(n,text,to,condition=always,effects=[])=>({
  id:id(500+n),order:0,label:"default",authorStatus:"configured",
  condition,responseText:text,dialogueText:"",speakerId:null,
  responsePerformance:performance,dialoguePerformance:performance,
  effects, after:to?[{id:id(900+n),type:"transition",destination:{nodeId:to.id,openingId:null}}]:[],
});
const input=(n,from,label,kind,x,to,text,{when=always,effects=[]}={})=>({
  id:id(300+n),sourceNodeId:from.id,order:n,wording:label,
  matchMode:"command",outcomeSelection:"first",choiceVisibility:"immediate",
  // Visibility makes options discoverable; the matching outcome condition
  // enforces the same prerequisite even if a player types a hidden command.
  choiceVisibleWhen:when,streetPlacement:{kind,x,y:114},
  aliases:[label],tags:["preview"],notes:"",
  outcomes:[outcome(n,text,to,when,effects)],
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
    input(1,home,"accept the bounty","object",150,street,
      "You take the assignment. Deliveries are missing near South Market. Ask around before drawing conclusions.",{
        when:not(flag(BOUNTY_ACTIVE)), effects:[
          effect(1,BOUNTY_ACTIVE), effect(2,CASE_RESOLVED,false), effect(3,CASE_PAID,false),
          effect(4,HEARD_VENDOR,false), effect(5,FOUND_CRATE,false),
          effect(6,SPOKE_TO_DIGIMON,false), effect(7,SAW_COMPANION,false),
        ],
      }),
    input(2,street,"ask the vendor","person",148,null,
      "The vendor remembers that the Digimon looked frightened, not hostile. They mention hearing noises in the service alley.",{
        effects:[effect(8,HEARD_VENDOR)],
      }),
    input(3,street,"examine the damaged crate","object",268,null,
      "Claw marks line the inside of the crate. A trail of packaging leads toward the service alley.",{
        effects:[effect(9,FOUND_CRATE)],
      }),
    input(4,street,"enter the service alley","entrance",410,alley,
      "You follow the clues into the alley. Something rustles behind a delivery box.",{
        when:KNOWS_ALLEY,
      }),
    input(5,street,"return home","entrance",580,home,
      "You return to the Cleaner office. The case remains open.",{
        when:flag(BOUNTY_ACTIVE),
      }),
    input(6,alley,"ask what happened","person",144,null,
      "The Digimon gradually relaxes. It says it took the supplies to help a wounded companion.",{
        effects:[effect(10,SPOKE_TO_DIGIMON)],
      }),
    input(7,alley,"look behind the box","object",267,null,
      "An exhausted Digimon is resting in an improvised nest. The deliveries were used for warmth and shelter.",{
        effects:[effect(11,SAW_COMPANION)],
      }),
    input(8,alley,"offer to help them","person",398,peaceful,
      "Understanding what happened, you offer to negotiate with the vendor and keep both Digimon safe.",{
        when:UNDERSTANDS_SITUATION,
        effects:[effect(12,CASE_RESOLVED),effect(13,BOUNTY_ACTIVE,false)],
      }),
    input(9,alley,"return the supplies to the client","object",540,paid,
      "You return the supplies. The client pays, though you may not know the whole story.",{
        effects:[effect(14,CASE_RESOLVED),effect(15,CASE_PAID),effect(16,BOUNTY_ACTIVE,false)],
      }),
    input(10,alley,"return to the market","entrance",650,street,
      "You retrace your steps to the market."),
    input(11,peaceful,"return to the office","entrance",156,home,
      "You head home without a payout. The case is complete."),
    input(12,paid,"return to the office","entrance",156,home,
      "You head home after collecting the fee. The case is complete."),
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
