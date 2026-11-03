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

export const STREET_ACTOR_FILES = {
  cleaner: { file: "cleaner-walk.png", width: 30, height: 52, frames: 4 },
  partner: { file: "partner-walk.png", width: 42, height: 30, frames: 4 },
} as const;

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

export function actorFrame(elapsed: number, moving: boolean, frames = 4) {
  if (!moving || !Number.isFinite(elapsed)) return 0;
  return Math.floor(Math.max(0, elapsed) / 165) % frames;
}

export function drawActor(
  ctx: CanvasRenderingContext2D,
  atlas: ActorAtlas,
  x: number,
  groundY: number,
  frame: number,
  facing: -1 | 1,
) {
  const { frameWidth: width, frameHeight: height, image, frames } = atlas;
  const index = Math.max(0, Math.min(frames - 1, Math.trunc(frame)));
  const drawX = Math.round(x);
  const drawY = Math.round(groundY) - height;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (facing < 0) {
    ctx.translate(drawX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, index * width, 0, width, height, -Math.floor(width / 2), drawY, width, height);
  } else {
    ctx.drawImage(image, index * width, 0, width, height, drawX - Math.floor(width / 2), drawY, width, height);
  }
  ctx.restore();
}
