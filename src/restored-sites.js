import { perChapter, chapterOf } from './path-shape.js';
import { nodesFor } from './trail-layout.js';
// Completed story state comes from existing checkpoint records, never a second save.
export function restoredSites(e) {
  const chapter = chapterOf(e),
    sites = [];
  for (const record of e.completed || []) {
    const c = chapterOf(e, record.index),
      side = e.choices[c];
    if (c >= chapter || !side) continue;
    const node = nodesFor(e, c, side)[record.index % perChapter(e)];
    sites.push({
      ...node,
      type: record.type,
      id: record.id,
      propX: node.x + (side === 'left' ? -1 : 1) * 2.75,
      propZ: node.z + 2.8,
    });
  }
  return sites;
}
