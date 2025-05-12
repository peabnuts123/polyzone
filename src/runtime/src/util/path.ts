/**
 * Get the file extension of the given path. Includes the dot e.g. `.txt`.
 * Returns empty string if file has no extension.
 * @param path File path e.g. `models/player/player.obj`
 * @returns File extension include the dot (e.g. `.obj`), or empty string if path has no extension.
 */
export function getFileExtension(path: string): string {
  const match = /\.[^.]+$/.exec(path);
  if (match === null) {
    return '';
  } else {
    return match[0];
  }
}

/**
 * Convert a path string into a list of string path segments,
 * excluding the file's base name itself.
 */
export function toPathList(path: string): string[] {
  const pathSegments = path.split(/\/+/g);
  // Drop the basename from the path
  pathSegments.pop();
  return pathSegments;
}

/**
 * Get the filename from a path. e.g. `textures/house/brick.png` => `brick.png`
 * Assumes the last segment in the path is a file name, does not do any validation
 * to check whether the path is a directory path.
 */
export function baseName(path: string): string {
  return path.split(/\/+/g).pop()!;
}

/**
 * Rename the file (base name) part of a path, preserving the full parent path
 * @param path Path to rename
 * @param newBaseName New base (i.e. file) name
 * @returns Full path with the renamed file
 */
export function rename(path: string, newBaseName: string): string {
  const pathList = toPathList(path);
  pathList.push(newBaseName);
  return pathList.join('/');
}

/**
 * Canonicalise a given path string. e.g. `/models/../textures/asphalt.png` => `/textures/asphalt.png`
 * @param path A path string. Can be absolute or relative.
 * @param stripProtocol Whether the path needs to have a protocol stripped from it first (e.g. `http://`)
 * @returns Canonicalised string. Whether `path` was absolute or relative will be respected in the result.
 */
export function canonicalisePath(path: string, stripProtocol: boolean = false): string {
  if (stripProtocol) {
    path = stripProtocolFromUri(path);
  }

  // @NOTE lo-fi canonicalisation hack
  const canonical = decodeURIComponent(
    new URL(path, 'http://foo.bar').pathname,
  );

  // Trim leading slash if path was relative
  if (path.startsWith('/')) {
    return canonical;
  } else {
    return canonical.replace(/^\//, '');
  }
}

/**
 * Whether 2 paths are canonically equivalent i.e. equal after being canonicalised.
 * @example
 * ```typescript
 * arePathsCanonicallyEquivalent("textures/asphalt.png", "textures/asphalt.png"); // true
 * arePathsCanonicallyEquivalent("models/../textures/asphalt.png", "textures/asphalt.png"); // true
 * arePathsCanonicallyEquivalent("models/textures/asphalt.png", "textures/asphalt.png"); // false; different paths
 * arePathsCanonicallyEquivalent("textures/asphalt.png", "/textures/asphalt.png"); // false; one is relative, one is absolute
 * ```
 * @param pathA
 * @param pathB
 * @param stripProtocol Whether the paths need to have a protocol stripped from them first (e.g. `http://`)
 */
export function arePathsCanonicallyEquivalent(pathA: string, pathB: string, stripProtocol: boolean = false): boolean {
  return canonicalisePath(pathA, stripProtocol) === canonicalisePath(pathB, stripProtocol);
}

/**
 * Whether 2 URIs are canonically equivalent e.g. `http://foo.bar/models/../textures/asphalt.png` === `http://foo.bar/textures/asphalt.png`
 * @param uriA
 * @param uriB
 * @returns True if protocols are the same
 */
export function areUrisCanonicallyEquivalent(uriA: string, uriB: string): boolean {
  const protocolA = extractProtocolFromUri(uriA);
  const protocolB = extractProtocolFromUri(uriB);
  if (protocolA !== protocolB) return false;

  return arePathsCanonicallyEquivalent(uriA, uriB, true);
}

/**
 * Strip the protocol component from a URI. e.g. `http://foo.bar` => `foo.bar`.
 * NOTE: It is assumed `uri` is a roughly valid URI, so anything preceding `://` will be naively stripped.
 * @param uri URI from which the protocol is to be stripped.
 */
export function stripProtocolFromUri(uri: string): string {
  return uri.replace(/^.*:\/\//, '');
}

/**
 * Extract the protocol component from a URI. e.g. `http://foo.bar` => `http://`.
 * NOTE: It is assumed `uri` is a roughly valid URI, so anything preceding `://` will be naively extracted.
 * @param uri URI from which the protocol is to be extracted.
 */
export function extractProtocolFromUri(uri: string): string {
  const match = uri.match(/^(.*:\/\/)/);
  if (match === null) {
    return '';
  } else {
    return match[1];
  }
}
