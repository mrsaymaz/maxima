# solMaxima 0.69.0 · The story of the Sol Crystal

Mr. Saymaz now tells a light story across the three arenas, in short illustrated cut-scenes with English dialogue read aloud.

## The story

Long ago, the Sol Crystal lit the valley; the gold crystal in the solMaxima logo is that crystal. It shattered into three shards. Without its light, the three guardians forgot their words and began to block the paths. The student's English brings back each guardian's words, and winning each fight returns a shard. With all three shards, the Sol Crystal shines again.

| When | Scene |
|---|---|
| First entry to each arena | Intro: Whisperwood (the prologue), Skyreach, Stormglass |
| Before each guardian's first fight (after the Elemental Shrine) | The guardian: Mossback Warden, Galecrest Warden, Stormglass Sentinel. Mr. Saymaz explains why it blocks the path and how to fight it. |
| After winning each fight, before the evolution | The shard returns. After Stormglass, the finale follows. |
| Knocked out in the arena | A short line ("Shake it off! Watch the amber zones this time."), shown and read aloud |
| Out of lives | The encouragement on the Out of lives screen, read aloud |

Each scene plays once per device (`save.story.seen`). **Journal → Settings → The Sol Crystal story** replays the scenes seen so far.

## At the student's level

Every line has two versions (`src/story.js`):
- **Grades 5–6 (A1):** short sentences with everyday words.
- **Grades 7–8 (A2):** longer sentences with richer vocabulary.

The student's current lesson grade picks the version. Each line also has a Turkish translation behind a **TR** button.

## Cut-scenes

`src/story-scene.js` and `story.css` draw a full-screen panel over the paused game:
- a painted SVG backdrop for the arena: rolling forest, sandstone mesas with a sky bridge, crystal spires under a violet sky;
- the Sol Crystal emblem with three shard lights that fill as shards come back;
- the guardian's silhouette with glowing eyes, in guardian scenes;
- Mr. Saymaz in a pose that fits the line;
- a dialogue box with his name tag and the controls Skip, TR, 🔊, and Next / Fight! / Let's go!.

Tapping the line also moves on, and on a keyboard Enter, Space or → moves on and Esc skips.

## Voice

Lines are read aloud with a British male voice where the device has one (`storyVoice` in `voice-preference.js`): Apple Daniel, Arthur or Oliver; Google UK English Male; Microsoft Ryan, Thomas or George. Next comes any male English voice, then any British voice, then any English voice.

- The rate is a little slower for Grades 5–6.
- Speech follows the **Read English aloud** setting.
- Phones only allow speech that starts from a tap, so the first tap anywhere unlocks it silently.

Pre-recording the lines with a British male voice (Kokoro `bm_george` or `bm_lewis`) would make him sound the same on every device. That needs the 350 MB voice model, so it was left for later.
