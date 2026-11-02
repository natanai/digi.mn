import { useRef, type Dispatch, type PointerEvent, type SetStateAction } from "react";
import type { Interaction, InteractionStreetPlacement } from "../../narrative/model";
import { clampStreetPlacement, type LayoutDraft } from "../layout";
import "./streetLayout.css";

/** This is the spatial editor for Narrative-owned placements, not a second Interaction editor. */
export function StreetLayoutEditor({
  draft, setDraft, interactions, onEdit, dirty,
}: {
  draft: LayoutDraft;
  setDraft: Dispatch<SetStateAction<LayoutDraft>>;
  interactions: readonly Interaction[];
  onEdit: (id: string) => void;
  dirty: boolean;
}) {
  const activeDrag = useRef<{ id: string; pointerId: number } | null>(null);
  const targetInputs = interactions.filter((item) => item.sourceNodeId === draft.nodeId && item.matchMode !== "fallback");
  const placed = targetInputs.filter((item) => draft.placements[item.id]);
  const unplaced = targetInputs.filter((item) => !draft.placements[item.id]);
  const width = Math.max(768, ...placed.map((item) => (draft.placements[item.id]?.x ?? 0) + 120));
  const change = (id: string, position: InteractionStreetPlacement | null) => setDraft((current) => ({
    ...current, placements: { ...current.placements, [id]: position },
  }));

  const coordinates = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return clampStreetPlacement((event.clientX - rect.left) * (width / rect.width),
      (event.clientY - rect.top) * (160 / rect.height));
  };

  const onDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!activeDrag.current || event.pointerId !== activeDrag.current.pointerId) return;
    const id = activeDrag.current.id;
    const point = coordinates(event);
    setDraft((current) => {
      const previous = current.placements[id];
      if (!previous || (previous.x === point.x && previous.y === point.y)) return current;
      return { ...current, placements: { ...current.placements, [id]: { ...previous, ...point } } };
    });
  };

  const stopDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!activeDrag.current || event.pointerId !== activeDrag.current.pointerId) return;
    onDrag(event);
    activeDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <div className="digi-layout-editor">
    <p>Drag markers or use arrow keys when focused. SAVE this layout before opening another interaction. The same existing narrative responses and transitions remain in effect.</p>
    <div className="digi-layout-scroll">
      <svg role="group" aria-label="Editable street layout" width={width} height={160} viewBox={`0 0 ${width} 160`}
        onPointerMove={onDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
        <rect width={width} height="160" fill="#2a3340" />
        {Array.from({ length: Math.ceil(width / 96) }, (_, i) => <g key={i}>
          <rect x={i * 96 + 2} y={18 + i % 3 * 4} width="90" height="76" fill={["#5e6470","#69616d","#556a6b"][i % 3]} />
          {Array.from({ length: 4 }, (_, j) => <rect key={j} x={i * 96 + 11 + j * 19} y="38" width="11" height="18" fill="#2c3f50" />)}
        </g>)}
        <rect y="96" width={width} height="41" fill="#ad9e91" />
        <path d={`M0 104H${width} M0 129H${width}`} stroke="#f6eedc" strokeOpacity=".45" strokeDasharray="8 8" />
        {placed.map((item) => {
          const placement = draft.placements[item.id]!;
          return <g key={item.id} transform={`translate(${placement.x} ${placement.y})`}
            role="button" tabIndex={0} aria-label={`Move ${item.wording || item.id}, currently x ${placement.x}, depth ${placement.y}`}
            onKeyDown={(event) => {
              const directions: Record<string, [number, number]> = { ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-1],ArrowDown:[0,1] };
              const shift = directions[event.key];
              if (!shift) return;
              event.preventDefault();
              change(item.id, { ...placement, ...clampStreetPlacement(placement.x + shift[0], placement.y + shift[1]) });
            }}
            onPointerDown={(event) => {
              event.preventDefault(); event.stopPropagation();
              activeDrag.current = { id: item.id, pointerId: event.pointerId };
              const svg = event.currentTarget.ownerSVGElement;
              svg?.setPointerCapture(event.pointerId);
            }}>
            <circle cy="-12" r="12" fill={placement.kind === "person" ? "#a0dfd5" : placement.kind === "entrance" ? "#e3bb82" : "#b4b9db"} stroke="#19202c" strokeWidth="2" />
            <text y="-8" fontSize="12" textAnchor="middle" fill="#18212e" pointerEvents="none">{placement.kind === "person" ? "P" : placement.kind === "entrance" ? "D" : "O"}</text>
            <circle r="3" fill="#f9f4e6" pointerEvents="none" />
          </g>;
        })}
      </svg>
    </div>
    <div className="digi-layout-list">
      {placed.map((item) => {
        const placement = draft.placements[item.id]!;
        return <div className="digi-layout-row" key={item.id}>
          <span>{item.wording || item.aliases[0] || "Untitled interaction"} <small>{placement.kind} · {placement.x}, {placement.y}</small></span>
          <button type="button" disabled={dirty} onClick={() => onEdit(item.id)}>EDIT</button>
          <button type="button" onClick={() => change(item.id, null)}>REMOVE</button>
        </div>;
      })}
      {unplaced.map((item,i) => <div className="digi-layout-row" key={item.id}>
        <span>{item.wording || item.aliases[0] || "Untitled interaction"} <small>Not on street</small></span>
        <button type="button" onClick={() => change(item.id, {kind:"object", ...clampStreetPlacement(160 + (placed.length+i)*72, 114)})}>PLACE</button>
        <button type="button" onClick={() => onEdit(item.id)}>EDIT</button>
      </div>)}
      {!targetInputs.length && <p>Create a Node input first, then return here to place it.</p>}
    </div>
  </div>;
}
