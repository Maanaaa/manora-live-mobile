// Logique pure de la galerie (sans React ni réseau), testée dans tests/photo-list.test.cjs.

type Item = { id: string; createdAt: string };

/** Fusionne des photos dans une liste : sans doublon, la plus récente en premier. */
export function mergePhotos<T extends Item>(current: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>();
  for (const photo of current) byId.set(photo.id, photo);
  for (const photo of incoming) byId.set(photo.id, photo);
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function removePhoto<T extends Item>(current: T[], id: string): T[] {
  return current.some((p) => p.id === id) ? current.filter((p) => p.id !== id) : current;
}

/**
 * Code d'événement saisi à la main ou lu dans un lien `manoralive://join?code=…`
 * (ou une URL web contenant `?code=`). Renvoie le code sans espaces, tel quel (la casse est
 * laissée à l'API), ou null s'il n'est pas valide.
 */
export function parseEventCode(input: string | null | undefined): string | null {
  if (!input) return null;
  let value = input.trim();
  const match = /[?&]code=([^&#]+)/i.exec(value);
  if (match) {
    try {
      value = decodeURIComponent(match[1]);
    } catch {
      value = match[1];
    }
  }
  const code = value.replace(/\s+/g, '');
  return /^[A-Za-z0-9_-]{3,64}$/.test(code) ? code : null;
}
