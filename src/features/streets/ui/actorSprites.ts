/**
 * digi.mn's starter actor art, loaded from the same /assets/ directory used by
 * pre-programmed. Desktop installations can replace these two PNG files inside
 * the portable assets/sprites folder, without recompiling or changing story data.
 *
 * Each atlas contains exactly four transparent, horizontal frames.
 * This is visual presentation only: companion autonomy and Sapotama progression
 * are not inferred from the appearance of the demo sprite.
 */
export type ActorAtlas = {
  readonly image: HTMLImageElement;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frames: number;
};

export type StreetActorArt = {
  readonly cleaner: ActorAtlas | null;
  readonly partner: ActorAtlas | null;
};

import { STREET_ACTOR_FILES, actorFrameGeometry } from "../spriteFrames";
export { STREET_ACTOR_FILES, actorFrame } from "../spriteFrames";

function assetPath(filename: string) {
  // GitHub Pages currently lives under /digi.mn/; the Windows portable host
  // runs at / and allows replacement files in its adjacent assets/ directory.
  const prefix = window.location.pathname.startsWith("/digi.mn/") ? "/digi.mn/" : "/";
  return prefix + "assets/sprites/" + filename;
}

export function readActorAtlas(
  file: { readonly file: string; readonly width: number; readonly height: number; readonly frames: number },
): Promise<ActorAtlas | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      // Reject malformed replacements instead of slicing the wrong frames or
      // accidentally rendering the entire sheet as one giant actor.
      resolve(image.naturalWidth === file.width * file.frames && image.naturalHeight === file.height
        ? { image, frameWidth: file.width, frameHeight: file.height, frames: file.frames }
        : null);
    };
    image.onerror = () => resolve(null);
    image.src = assetPath(file.file);
  });
}

export async function loadStreetActorArt(): Promise<StreetActorArt> {
  const [cleaner, partner] = await Promise.all([
    readActorAtlas(STREET_ACTOR_FILES.cleaner),
    readActorAtlas(STREET_ACTOR_FILES.partner),
  ]);
  return { cleaner, partner };
}

export function drawActor(
  ctx: CanvasRenderingContext2D,
  atlas: ActorAtlas,
  x: number,
  groundY: number,
  frame: number,
  facing: -1 | 1,
) {
  const frameRect = actorFrameGeometry(atlas, x, groundY, frame, facing);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (frameRect.mirrorOriginX !== null) {
    ctx.translate(frameRect.mirrorOriginX, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    atlas.image, frameRect.sourceX, frameRect.sourceY,
    frameRect.width, frameRect.height,
    frameRect.destinationX, frameRect.destinationY,
    frameRect.width, frameRect.height,
  );
  ctx.restore();
}
