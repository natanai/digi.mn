import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { renderStreet } from "./ui/renderer";
import { DistrictMap } from "./ui/DistrictMap";
import type { DistrictLayout } from "./district";
import { buildStreetScene, integerPixelScale, nearbyStreetObject, VIEW_HEIGHT, VIEW_WIDTH, type StreetChoice, type StreetPosition } from "./scene";
import { canvasStreetPoint, hitStreetObject, resolveStreetPointer, walkToStreetPoint, type StreetPointerTarget, streetCamera } from "./pointer";
import "./street.css";

const spawn = (): StreetPosition => ({ x: 56, y: 114 });

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
  const destination = useRef<StreetPointerTarget | null>(null);
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;
  const [hint, setHint] = useState("");
  const [hoverTarget, setHoverTarget] = useState(false);
  const [scale, setScale] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const mapOpenRef = useRef(false);
  mapOpenRef.current = mapOpen;

  // A new physical street resets motion. Narrative text changes within the
  // same street do not teleport the player or restart their walking animation.
  useEffect(() => {
    position.current = spawn();
    destination.current = null;
    setHint("");
    setHoverTarget(false);
    setMapOpen(false);
  }, [seed]);

  useEffect(() => {
    const box = frame.current;
    if (!box) return;
    const observe = new ResizeObserver(() => setScale(integerPixelScale(box.clientWidth, box.clientHeight)));
    observe.observe(box);
    setScale(integerPixelScale(box.clientWidth, box.clientHeight));
    return () => observe.disconnect();
  }, []);

  useEffect(() => {
    // Only Escape closes the overhead map. No keys steer the avatar, which keeps
    // the Author/terminal keyboard interaction completely independent of motion.
    const keyDown = (event: KeyboardEvent) => {
      if (mapOpenRef.current && event.key === "Escape") {
        event.preventDefault();
        setMapOpen(false);
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);

  useEffect(() => {
    let frameId = 0;
    let previous = 0;
    const tick = (now: number) => {
      const delta = previous ? (now - previous) / 1000 : 0;
      previous = now;
      let moving = false;
      const intent = destination.current;
      if (!mapOpenRef.current && intent) {
        const target = intent.kind === "interact"
          ? scene.objects.find((object) => object.id === intent.objectId)
          : null;
        if (intent.kind === "interact" && !target) {
          // The authored interaction became unavailable after a narrative
          // change. Never dispatch a stale input to the new Node.
          destination.current = null;
          setHint("");
        } else if (intent.kind === "interact" && target
          && nearbyStreetObject(position.current, [target], 20)) {
          destination.current = null; // prevent duplicate responses
          setHint("");
          chooseRef.current(target.input);
        } else {
          const before = position.current;
          const next = walkToStreetPoint(before, intent.position, delta, scene.width);
          position.current = next.position;
          moving = Math.hypot(next.position.x - before.x, next.position.y - before.y) > 0.01;
          if (next.arrived && intent.kind === "walk") {
            destination.current = null;
            setHint("");
          }
        }
      }
      const context = canvas.current?.getContext("2d");
      if (context) renderStreet(context, scene, position.current, now, moving, destination.current?.position ?? null);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [scene]);

  const canvasPoint = (event: PointerEvent<HTMLCanvasElement>): StreetPosition | null =>
    canvasStreetPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());

  const clickScene = (event: PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    if (mapOpenRef.current || event.button !== 0) return;
    const point = canvasPoint(event);
    if (!point) return;
    const target = resolveStreetPointer(point, scene, position.current);
    if (!target) return;
    destination.current = target; // a second click replaces any in-progress walk
    const object = target.kind === "interact"
      ? scene.objects.find((item) => item.id === target.objectId) : null;
    setHint(object ? `Approaching: ${object.label}` : "Walking");
  };

  const hoverScene = (event: PointerEvent<HTMLCanvasElement>) => {
    if (mapOpenRef.current || destination.current) return;
    const point = canvasPoint(event);
    if (!point) return;
    const target = hitStreetObject(point, scene, streetCamera(scene.width, position.current.x));
    setHoverTarget(Boolean(target));
    setHint((previous) => {
      const label = target ? `Click to interact: ${target.label}` : "";
      return previous === label ? previous : label;
    });
  };

  const stopWalking = () => {
    destination.current = null;
    setHint("");
  };

  return <section className={`digi-street${mapOpen ? " digi-street-map-open" : ""}`} aria-label="Point-and-click town">
    <div className="digi-street-bar" onPointerDown={(event) => event.stopPropagation()}>
      <strong>STREET</strong>
      <span>CLICK TO WALK · CLICK TO INTERACT</span>
      <button type="button" aria-pressed={mapOpen} onClick={() => {
        stopWalking();
        setMapOpen((open) => !open);
      }}>{mapOpen ? "BACK TO STREET" : "DISTRICT MAP"}</button>
    </div>
    <div ref={frame} className="digi-street-frame" role="group"
      aria-label="Point-and-click town scene. Click ground to walk or a character, object, or door to approach and interact. The terminal offers the same interactions.">
      <canvas ref={canvas} width={VIEW_WIDTH} height={VIEW_HEIGHT}
        style={{ width: VIEW_WIDTH * scale, height: VIEW_HEIGHT * scale, cursor: hoverTarget ? "pointer" : "crosshair" }}
        onPointerDown={clickScene} onPointerMove={hoverScene}
        onPointerLeave={() => { setHoverTarget(false); if (!destination.current) setHint(""); }}
        aria-label="Pixel-art point-and-click town" role="img" />
    </div>
    {mapOpen ? <DistrictMap district={district} currentNodeId={currentNodeId} visitedNodeIds={visitedNodeIds} /> : null}
    <div className="digi-street-caption" onPointerDown={(event) => event.stopPropagation()}>
      {mapOpen ? <span>The map is informational; use doors in the street to travel.</span>
        : destination.current ? <>
          <span>{hint || "Walking"}</span>
          <button type="button" onClick={stopWalking}>CANCEL</button>
        </>
        : <span>{hint || (scene.objects.length
          ? "Click the ground to walk, or click a person, object, or entrance to interact."
          : "Add authored street placements to populate this scene.")}</span>}
    </div>
  </section>;
}
