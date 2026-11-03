/** One-way conversion for authored data created by the path-only prototype. */
export function legacyAssetId(path: string) {
  if (!path) return "";
  return path.startsWith("repo:") ? path : `repo:/${path.replace(/^\/+/, "")}`;
}

/**
 * Legacy serialized cues held a file path. Modern authored cues hold a stable
 * Media ID, which must NOT be rewritten into a file URL by Worker persistence.
 * Only recognizable older file-path references are migrated.
 */
export function normalizeMediaCueAssetReference(value: string) {
  const pathLike = /[\\/]/.test(value)
    || /\.(?:png|jpg|jpeg|webp|gif|svg|bmp|wav|mp3|ogg|flac|m4a)$/i.test(value);
  return pathLike ? legacyAssetId(value) : value;
}
