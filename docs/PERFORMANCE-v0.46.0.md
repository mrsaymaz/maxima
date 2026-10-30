# Maxima v0.46.0 — loading, resources and recovery

## Scope and evidence

Based on v0.45.0. The three-arena progression, all English content, checkpoints,
independent teams, bosses, original creature geometry/textures and animations are
retained. This release keeps the v0.45 browser-save namespace and backup format.
No new player reset is introduced.

The preview CLI reported `preview relay unavailable`. It was not possible to run
live browser/WebGL, capture a cold network trace or measure a student's device.
The numerical comparison below is a static source dependency budget, not actual
compressed network traffic, first-paint speed, GPU memory or measured FPS.

| Fresh default journey | v0.45.0 | v0.46.0 |
| --- | ---: | ---: |
| Lesson data before opening | 3,010,235 bytes | 85,088 bytes |
| Estimated startup source budget | 6,904,001 bytes | approximately 4,005,000 bytes |
| Initial lesson banks | all 44 | selected lesson |

The complete dist archive remains large because every creature, lesson and media
file is still available. Per-lesson JSONs also ship alongside the full authoring
bank. Package size is not the initial transfer size. Cold transfer totals vary
with HTTP compression, browser cache, selected creature/form and saved UI state.
`LOADING-BUDGET-v0.46.0.json` contains exact source file lists and assumptions.

## Loading flow

1. A catalogue provides all lesson names, grade metadata and curriculum labels.
2. The selected lesson loads and validates before task/mastery code can use it.
3. The selected creature begins fetching before synchronous world construction.
4. Only after the opening is ready does a delayed, optional next-form prefetch run.

The lesson library retains three full banks and evicts older banks back to
metadata. Repeated or concurrent requests share their work. A failed selection
leaves the old selected unit and accepted task intact. JSON requests have an
18-second body-inclusive deadline and one transient retry. Model requests have a
20-second deadline and one retry, use a request-local Three.js loading manager,
and dispose a parsed model if it arrives after cancellation/timeout. Missing
files are not repeatedly fetched. Explicit cancellation does not retry.

The next form is prepared after 1.2 seconds when its partner/level still match.
Data Saver, 2G and hidden tabs suppress optional prefetch. Backgrounding cancels
idle loads. Prefetch never awards points, answers tasks or changes progression.

## Creature cache and ownership

At most two parsed form templates are retained when there are no additional
active leases. Active instances protect their source from eviction. Loading the
same partner/form concurrently shares one promise; loading an already adopted
form for another run does not reconstruct it. Evolution clones the current and
next cached templates instead of requesting their files again.

Each instance has independent skeletons, bones, materials and animation mixers.
Geometry, textures and clips are immutable shared source data. Releasing an
instance frees its materials and skeleton resources once. Eviction frees source
geometry/textures and closes source ImageBitmaps only after the final lease is
gone. Scenery disposal deduplicates shared geometry/material/texture references.
Control listeners, the resize observer, render targets and renderer are detached
on world disposal. Postprocessing targets are freed immediately when full
effects are disabled and recreated at the current size when required.

Decoded audio is bounded too: 32 voice clips and four music stems. Cancelling a
voice while it is loading/decoding cannot start stale speech after backgrounding.

## Adaptive resolution

The student's preset, shadows and effects remain explicit choices. Adaptive
resolution changes only the rendering buffer; DOM English text remains sharp.
The effective ratio never exceeds the device ratio or chosen cap, and bottoms
out at 0.5. Sustained windows of slow visible gameplay lower the ratio in 0.10
steps; long stable windows can recover in 0.05 steps. Hysteresis/cooldowns avoid
oscillation. Menus, hidden gaps, foreground loading and the first resumed frame
do not drive adaptation. Exploration, English reading and evolution are sampled.
The toggle and current ratio are in Graphics and performance. Adaptive changes
are session-local and do not overwrite the saved manual cap.

This controller is not a 60-FPS guarantee. CPU-bound scenes, heat, browser policy
and device hardware can still limit performance. Low/30-FPS device acceptance
must be assessed on actual phones.

## Lifecycle and graphics recovery

Visibility/pagehide events clear held movement, stop automatic walking, stop
speech/music and persist the current checkpoint. Simulation stays paused until
the student explicitly resumes; the first resumed clock interval is excluded
from frame metrics. Safe-resume invulnerability prevents an immediate hazard hit.

`webglcontextlost` is cancelled and simulation stops. Three's restoration runs,
then the game invalidates geometry upload state, releases old postprocessing
targets, refreshes size/shadows and offers Continue. CPU-side scene/assets are
retained, so accepted mechanisms, guardian seals and coin state are unchanged.
If a driver cannot restore, the overlay offers a saved-checkpoint reload. No
claim is made that every browser/driver will restore a lost context.

## Profiling and limits

Journey journal → Graphics and performance → Export device report records:

- Browser-reported startup request counts, transfer/encoded/decoded body sizes
  and the ten largest opening resources. Requests begun after ready, including
  next-form prefetch, are excluded. A zero transfer value can mean a cached entry
  or unavailable size metadata; it is not assumed to mean a free download.
- Frame observations by exploration, task and evolution, including p95 and stalls.
  Draw counts now include all rendered passes, including postprocessing.
- Renderer texture/geometry/program counts; scene and cached-template texture
  storage estimates; cache hit/miss/lease/eviction/disposal counts. Sampling is
  every five seconds with a bounded 15-minute history and retained peaks.
- Adaptive ratio/cap changes and context loss/restore/resume counts.

These reports are local exports with no telemetry upload or student identifiers.
Texture byte estimates are not a GPU allocation measurement and do not fully
account for driver overhead, render buffers or closure-held shader resources.
`TEXTURE-AUDIT-v0.46.0.json` finds 44 source diffuse images at 2048×2048, about
21.3 MiB per image if stored as RGBA8 with a full mip chain. Only currently used
forms are loaded; summing every packaged image is not live memory usage.

No KTX2 encoder or compatible bundled transcoder was available. Original images
remain unchanged; GPU texture compression requires a separate conversion and
rendered quality/device check. Mesh/texture fidelity is not silently reduced.

## Verification

The full automated regression set passed 549 checks. Focused reruns cover the
final listener/restore cleanups. Tests cover actual app selection from split
lessons, failed selection/retry, cache cancellation/races, independent real rig
adoption, repeated bounded leases, disposal, timed-out late model completion,
voice cancellation, bounded audio, adaptive hysteresis and synthetic WebGL events.
A real partially completed app mechanism survives pause/loss/reload in the app
harness. Model/renderer arithmetic and synthetic events are not phone GPU tests.

Run `npm test` and `npm run build`. Build refreshes and verifies all 44 lesson
files against the complete language bank, then checks runtime/assets/rigs.
`npm run curriculum` also refreshes split data. `python3 scripts/audit-loading.py`
regenerates the current source and texture audits; `--baseline PATH` includes
an earlier extracted source tree for comparison. The optional audit needs Python 3
and Pillow; the deployed game and Node build do not depend on Python.

## Physical-device acceptance still required

Use a recent iPhone/Safari, modest Android/Chrome, tablet and computer. Start with
a cold cache on a stated network connection; export a report before and after
15–20 minutes including combat, reading, repeated evolution and team switching.
Repeat with warm caches and Low/Balanced. Check largest transfers, renderer count
plateaus, p95 frame time, stable resolution and heat. Interrupt a lesson/model
load, background during a partial task and a guardian finisher, and resume.
On a test device with the extension, `WEBGL_lose_context` can simulate loss and
restoration; verify the prompt, full scene, saved answers and safe continuation.
Do not certify the release from synthetic tests or source budgets alone.
