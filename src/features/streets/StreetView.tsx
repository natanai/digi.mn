import { useEffect, useMemo, useRef, useState } from "react";
import { renderStreet } from "./ui/renderer";
import { DistrictMap } from "./ui/DistrictMap";
import type { DistrictLayout } from "./district";
import { buildStreetScene, integerPixelScale, moveStreet, nearbyStreetObject, VIEW_HEIGHT, VIEW_WIDTH, type StreetChoice, type StreetPosition } from "./scene";
import "./street.css";

const spawn = (): StreetPosition => ({ x: 56, y: 114 });
const movementKeys: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
};
const isTyping = () => {
  const element = document.activeElement;
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || (element instanceof HTMLElement && element.isContentEditable);
};

export function StreetView({ seed, choices, onChoose, district, currentNodeId, visitedNodeIds }: {
  seed: string;
  choices: readonly StreetChoice[];
  onChoose: (text: string) => void;
  district: DistrictLayout;
  currentNodeId: string;
  visitedNodeIds: readonly string[];
}) {
  const choiceKey = JSON.stringify(choices);
  const scene = useMemo(() => buildStreetScene(seed, choices), [seed, choiceKey]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const position = useRef<StreetPosition>(spawn());
  const pressed = useRef(new Set<string>());
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;
  const nearbyRef = useRef<ReturnType<typeof nearbyStreetObject>>(null);
  const [nearbyLabel, setNearbyLabel] = useState("");
  const [scale, setScale] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const mapOpenRef = useRef(false);
  mapOpenRef.current = mapOpen;

  useEffect(() => { position.current = spawn(); pressed.current.clear(); setNearbyLabel(""); setMapOpen(false); }, [seed]);
  useEffect(() => {
    const box = frame.current;
    if (!box) return;
    const observe = new ResizeObserver(() => setScale(integerPixelScale(box.clientWidth, box.clientHeight)));
    observe.observe(box);
    setScale(integerPixelScale(box.clientWidth, box.clientHeight));
    return () => observe.disconnect();
  }, []);
  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (mapOpenRef.current) { if (event.key === "Escape") { event.preventDefault(); setMapOpen(false); } return; }
      if (isTyping() || event.altKey || event.ctrlKey || event.metaKey || event.repeat && event.key.toLowerCase() === "e") return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (movementKeys[key]) { event.preventDefault(); pressed.current.add(key); }
      else if (key === "e" && nearbyRef.current) {
        event.preventDefault();
        chooseRef.current(nearbyRef.current.input);
      }
    };
    const keyUp = (event: KeyboardEvent) => pressed.current.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    const clear = () => pressed.current.clear();
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("blur", clear); };
  }, []);
  useEffect(() => {
    let frameId = 0;
    let previous = 0;
    const tick = (now: number) => {
      const delta = previous ? (now - previous) / 1000 : 0;
      previous = now;
      let dx = 0; let dy = 0;
      for (const key of pressed.current) { dx += movementKeys[key]?.x ?? 0; dy += movementKeys[key]?.y ?? 0; }
      position.current = mapOpenRef.current ? position.current : moveStreet(position.current, { x: dx, y: dy }, delta, scene.width);
      const nearby = nearbyStreetObject(position.current, scene.objects);
      nearbyRef.current = nearby;
      const label = nearby?.label ?? "";
      setNearbyLabel((current) => current === label ? current : label);
      const context = canvas.current?.getContext("2d");
      if (context) renderStreet(context, scene, position.current, now, dx !== 0 || dy !== 0);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [scene]);

  return <section className={`digi-street${mapOpen ? " digi-street-map-open" : ""}`} aria-label="Side-on town prototype">
    <div className="digi-street-bar" onPointerDown={(event)=>event.stopPropagation()}>
      <strong>STREET</strong>
      <span>WASD / ARROWS · E INTERACT</span>
      <button type="button" aria-pressed={mapOpen} onClick={() => { pressed.current.clear(); setMapOpen((current)=>!current); }}>{mapOpen?"BACK TO STREET":"DISTRICT MAP"}</button>
    </div>
    <div ref={frame} className="digi-street-frame" tabIndex={0} role="group" aria-label="Town movement controls" onPointerDown={(event) => { event.stopPropagation(); frame.current?.focus(); }}>
      <canvas ref={canvas} width={VIEW_WIDTH} height={VIEW_HEIGHT}
        style={{ width: VIEW_WIDTH * scale, height: VIEW_HEIGHT * scale }}
        aria-label="Pixel-art town, controlled with arrows or WASD" role="img" />
    </div>
    {mapOpen ? <DistrictMap district={district} currentNodeId={currentNodeId} visitedNodeIds={visitedNodeIds} /> : null}
    <div className="digi-street-caption" onPointerDown={(event) => event.stopPropagation()}>
      {mapOpen ? <span>Map is informational. Enter buildings using the street interaction.</span> : nearbyLabel ? <button type="button" onClick={() => nearbyRef.current && chooseRef.current(nearbyRef.current.input)}>[E] {nearbyLabel}</button>
        : <span>{scene.objects.length ? "Walk toward a person, object, or entrance to interact." : "Author a street placement on a node interaction to populate this scene."}</span>}
    </div>
  </section>;
}
