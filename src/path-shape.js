// The shape of an expedition's path. Classic expeditions have 20 gates in five chapters of four. From pathVersion 3
// an area has six gates in three chapters of two (about 15–20 minutes): rivals guard each chapter's second gate,
// a chest stands on the first run of chapters 2 and 3 and on the final chase, and guardian sightings come on those
// same runs before the chase to the arena.
export const CLASSIC = Object.freeze({ chapters: 5, perChapter: 4, gates: 20 }),
  SHORT = Object.freeze({ chapters: 3, perChapter: 2, gates: 6 });
export const shortPath = e => e?.pathVersion === 3;
export const shapeOf = e => (shortPath(e) ? SHORT : CLASSIC);
export const gateCount = e => shapeOf(e).gates;
export const perChapter = e => shapeOf(e).perChapter;
export const chapterCount = e => shapeOf(e).chapters;
// Chapter of a gate index (clamped, so the end of the path belongs to the last chapter) and its slot in the chapter.
export const chapterOf = (e, index = e.index) => Math.min(chapterCount(e) - 1, Math.floor(index / perChapter(e)));
export const slotOf = (e, index = e.index) => index % perChapter(e);
export const pathDone = (e, index = e.index) => index >= gateCount(e);
