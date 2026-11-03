import { nearbyStreetObject, streetHash, VIEW_HEIGHT, VIEW_WIDTH, type StreetPosition, type StreetScene } from "../scene";
import { streetCamera } from "../pointer";
import { drawActor, type StreetActorArt } from "./actorSprites";

const palette = ["#535c70", "#6b6574", "#596e6f", "#7f6a62", "#5a6272"];

export function renderStreet(
  ctx: CanvasRenderingContext2D,
  scene: StreetScene,
  player: StreetPosition,
  elapsed: number,
  moving: boolean,
  target: StreetPosition | null = null,
  art: StreetActorArt | null = null,
  companion: StreetPosition | null = null,
  facing: -1 | 1 = 1,
  companionMoving = false,
  editing = false,
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const camera = streetCamera(scene.width, player.x);
  ctx.fillStyle = "#9dabb4";
  ctx.fillRect(0, 0, VIEW_WIDTH, 85);
  ctx.fillStyle = "#6b7282";
  ctx.fillRect(0, 78, VIEW_WIDTH, 23);
  for (let index = 0, bx = 0; bx < scene.width; index++) {
    const width = 62 + streetHash(scene.seed + ":building:" + index) % 40;
    const screenX = bx - camera;
    if (screenX + width >= 0 && screenX <= VIEW_WIDTH) {
      ctx.fillStyle = palette[streetHash(scene.seed + ":color:" + index) % palette.length];
      const roof = 12 + streetHash(scene.seed + ":roof:" + index) % 21;
      ctx.fillRect(screenX, roof, width - 3, 85 - roof);
      ctx.fillStyle = "#303a50";
      for (let win = 7; win < width - 13; win += 18) {
        ctx.fillRect(screenX + win, roof + 14, 10, 15);
        ctx.fillRect(screenX + win, roof + 38, 10, 15);
        ctx.fillStyle = "#b9a17b";
        if (streetHash(scene.seed + ":light:" + index + ":" + win) % 3 === 0) ctx.fillRect(screenX + win + 2, roof + 16, 6, 11);
        ctx.fillStyle = "#303a50";
      }
      ctx.fillStyle = "#303843";
      ctx.fillRect(screenX + 5, 81, width - 13, 2);
    }
    bx += width;
    if (bx > scene.width + 110) break;
  }
  ctx.fillStyle = "#c4bab0";
  ctx.fillRect(0, 91, VIEW_WIDTH, 33);
  ctx.fillStyle = "#968f87";
  ctx.fillRect(0, 120, VIEW_WIDTH, 4);
  ctx.fillStyle = "#596270";
  ctx.fillRect(0, 124, VIEW_WIDTH, 20);
  ctx.fillStyle = "#9ca4a9";
  for (let x = -camera % 40; x < VIEW_WIDTH; x += 40) ctx.fillRect(x, 137, 18, 1);

  const objects = [...scene.objects].sort((a, b) => a.y - b.y);
  for (const object of objects) {
    const x = Math.round(object.x - camera);
    const y = Math.round(object.y);
    if (x < -18 || x > VIEW_WIDTH + 18) continue;
    if (object.kind === "person") {
      ctx.fillStyle = "#3c3549";
      ctx.fillRect(x - 5, y - 20, 10, 5);
      ctx.fillStyle = "#d8b29a";
      ctx.fillRect(x - 4, y - 16, 8, 7);
      ctx.fillStyle = "#4c5969";
      ctx.fillRect(x - 6, y - 9, 12, 9);
      ctx.fillStyle = "#343a47";
      ctx.fillRect(x - 5, y, 4, 5);
      ctx.fillRect(x + 1, y, 4, 5);
    } else if (object.kind === "entrance") {
      ctx.fillStyle = "#343744";
      ctx.fillRect(x - 10, 69, 20, 37);
      ctx.fillStyle = "#a3b7b8";
      ctx.fillRect(x - 7, 72, 14, 31);
      ctx.fillStyle = "#495866";
      ctx.fillRect(x - 5, 74, 10, 27);
      ctx.fillStyle = "#e5bd78";
      ctx.fillRect(x + 2, 90, 2, 2);
    } else {
      ctx.fillStyle = "#45454b";
      ctx.fillRect(x - 8, y - 9, 16, 8);
      ctx.fillStyle = "#9d907c";
      ctx.fillRect(x - 6, y - 12, 12, 5);
      ctx.fillStyle = "#353843";
      ctx.fillRect(x - 7, y - 1, 3, 4);
      ctx.fillRect(x + 4, y - 1, 3, 4);
    }
    // The actual scene doubles as an Author inspection surface. Show a
    // compact selection outline, but leave the world and gameplay state alone.
    if (editing) {
      ctx.strokeStyle = "#f0e8d8";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 12, object.kind === "entrance" ? 67 : y - 25,
        24, object.kind === "entrance" ? 42 : 30);
    }
    if (nearbyStreetObject(player, [object], 29)) {
      ctx.fillStyle = "#fff2ad";
      ctx.fillRect(x - 2, y - 20, 5, 5);
      ctx.fillStyle = "#49413c";
      ctx.fillRect(x - 1, y - 19, 3, 3);
    }
  }
  // A subtle destination marker makes click-to-walk legible without covering
  // any character artwork or introducing an unrelated navigation widget.
  if (target) {
    const tx = Math.round(target.x - camera);
    const ty = Math.round(target.y);
    ctx.fillStyle = "#fff0a2";
    ctx.fillRect(tx - 4, ty + 5, 9, 1);
    ctx.fillRect(tx - 1, ty + 2, 3, 1);
    ctx.fillStyle = "#5e5038";
    ctx.fillRect(tx - 1, ty + 3, 3, 1);
  }
  // The companion follows visually, without creating a parallel gameplay actor
  // or triggering any Narrative interaction. Their red mane is part of the atlas.
  if (companion) {
    const cx = Math.round(companion.x - camera);
    const cy = Math.round(companion.y);
    if (art?.partner) {
      // Early concept sheets change silhouette between frames. Use the
      // consistent reference pose and a one-pixel footfall bob until the
      // authored sheets have properly registered animation frames.
      const bob = companionMoving ? Math.floor(elapsed / 170) % 2 : 0;
      drawActor(ctx, art.partner, cx, cy + 5 - bob, 0, facing);
    } else {
      // Explicit fallback when an installed PNG is missing or has wrong dimensions.
      ctx.fillStyle = "#343e7e";
      ctx.fillRect(cx - 9, cy - 12, 17, 12);
      ctx.fillStyle = "#d44367";
      ctx.fillRect(cx - 14, cy - 16, 8, 16);
      ctx.fillRect(cx + 5, cy - 18, 9, 18);
      ctx.fillStyle = "#e3dce7";
      ctx.fillRect(cx + 2, cy - 10, 4, 4);
    }
  }

  const px = Math.round(player.x - camera);
  const py = Math.round(player.y);
  if (art?.cleaner) {
    const bob = moving ? Math.floor(elapsed / 170) % 2 : 0;
    drawActor(ctx, art.cleaner, px, py + 6 - bob, 0, facing);
  } else {
    // Keep the engine usable even if its replaceable sprite image is deleted.
    const stride = moving ? Math.floor(elapsed / 140) % 2 : 0;
    ctx.fillStyle = "#353341";
    ctx.fillRect(px - 3, py - 5, 3, 5 + stride);
    ctx.fillRect(px + 1, py - 5, 3, 6 - stride);
    ctx.fillStyle = "#3e6373";
    ctx.fillRect(px - 5, py - 16, 10, 11);
    ctx.fillStyle = "#cfa388";
    ctx.fillRect(px - 4, py - 24, 8, 8);
    ctx.fillStyle = "#413844";
    ctx.fillRect(px - 5, py - 25, 10, 4);
    ctx.fillStyle = "#263545";
    ctx.fillRect(px - 5, py - 14, 2, 7);
    ctx.fillRect(px + 3, py - 14, 2, 7);
  }
}
