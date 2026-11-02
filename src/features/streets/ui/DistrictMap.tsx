import type { DistrictLayout } from "../district";

export function DistrictMap({
  district, currentNodeId, visitedNodeIds,
}: {
  district: DistrictLayout;
  currentNodeId: string;
  visitedNodeIds: readonly string[];
}) {
  const known = new Set([...visitedNodeIds, currentNodeId]);
  const byId = new Map(district.sites.map((site) => [site.nodeId, site]));
  return <div className="digi-district-map" role="region" aria-label="Overhead district map">
    <svg viewBox={`0 0 ${district.width} ${district.height}`} role="img" aria-label="Generated diagram of authored, connected streets; travel through entrances in the street scene">
      <rect width={district.width} height={district.height} fill="#29323a" />
      {Array.from({length:Math.ceil(district.width/32)},(_,i)=><path key={i} d={`M${i*32} 0V${district.height}`} stroke="#43505a" strokeWidth="1" />)}
      {Array.from({length:Math.ceil(district.height/32)},(_,i)=><path key={i} d={`M0 ${i*32}H${district.width}`} stroke="#43505a" strokeWidth="1" />)}
      {district.roads.map((road) => {
        const a=byId.get(road.from), b=byId.get(road.to);
        if (!a || !b || !(known.has(road.from) || known.has(road.to))) return null;
        return <path key={road.interactionId+":"+road.to} d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
          stroke="#9b9d99" strokeDasharray="4 4" strokeWidth="3" fill="none" />;
      })}
      {district.sites.filter((site)=> known.has(site.nodeId) || district.roads.some((road)=>road.from===currentNodeId && road.to===site.nodeId)).map((site) => {
        const active=site.nodeId===currentNodeId, visited=known.has(site.nodeId);
        return <g key={site.nodeId} transform={`translate(${site.x} ${site.y})`}>
          <rect x="-19" y="-16" width="38" height="32" rx="2" fill={active?"#d2b67b":visited?"#8298a1":"#586872"} stroke={active?"#fff2c1":"#b4c1c3"} strokeWidth={active?2:1}/>
          <rect x="-10" y="-9" width="20" height="12" fill="#37434f" />
          <text y="11" textAnchor="middle" fontSize="9" fontFamily="monospace" fill={active?"#202b30":"#f2f0e7"}>{visited?site.index:"?"}</text>
        </g>;
      })}
    </svg>
    <div className="digi-district-help">
      <span>Gold = current street · Grey = explored · ? = unvisited connection</span>
      <span>Travel by using street entrances. The map does not teleport you.</span>
    </div>
  </div>;
}
