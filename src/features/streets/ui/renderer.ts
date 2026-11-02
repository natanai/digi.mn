import { nearbyStreetObject, streetHash, VIEW_HEIGHT, VIEW_WIDTH, type StreetPosition, type StreetScene } from "../scene";

const palette = ["#535c70", "#6b6574", "#596e6f", "#7f6a62", "#5a6272"];

export function renderStreet(
  ctx: CanvasRenderingContext2D,
  scene: StreetScene,
  player: StreetPosition,
  elapsed: number,
  moving: boolean,
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const camera = Math.max(0, Math.min(scene.width - VIEW_WIDTH, Math.round(player.x - 94)));
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
    ctx.fillStyle = "#33424a";
    ctx.fillRect(x - 7, y - 11, 14, 11);
    ctx.fillStyle = "#d6c8a5";
    ctx.fillRect(x - 5, y - 9, 10, 6);
    ctx.fillStyle = "#26343c";
    ctx.fillRect(x - 3, y + 1, 6, 3);
    if (nearbyStreetObject(player, [object], 29)) {
      ctx.fillStyle = "#fff2ad";
      ctx.fillRect(x - 2, y - 20, 5, 5);
      ctx.fillStyle = "#49413c";
      ctx.fillRect(x - 1, y - 19, 3, 3);
    }
  }
  // Placeholder pixel sprite: walking legs alternate; replace via repository Media sprite sheets.
  const px = Math.round(player.x - camera);
  const py = Math.round(player.y);
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
