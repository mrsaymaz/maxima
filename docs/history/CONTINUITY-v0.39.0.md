# Maxima v0.39.0 — continuous mechanisms and measured creature contact

This release changes how existing world tasks stay present and how the four
creatures' eleven forms contact the world. It does not add units, alter language
content, change save versions, or change XP and coin rewards.

## Continuous world mechanisms

- Each of the twenty formats owns one permanent physical obstacle. Approach,
  reading, selection, correction, completion and closing keep that obstacle.
  The former separate exploration prop, route barrier and enlarged reading-stage
  scenery are no longer swapped in the live expedition.
- Reading pieces retain their world size. They unfold from an overhead rack,
  supported by hinged telescoping struts. They fold above the clear path after
  closing; the whole gate is never flattened or scaled away.
- Accepted answers drive the permanent gate's existing mechanical hardware.
  Delivery animations aim at its real receivers. Correct work survives mistakes,
  stepping away and reload through the existing saved task.
- Current gates survive world refreshes and nearby chapter transitions by stable
  expedition, branch and task-index identity. Completed distant sites reconstruct
  from existing milestone records when the student returns. No second save is used.
- Preparing an approach preview clones the practice selection state. It neither
  consumes language items nor creates an active saved task. Opening the gate uses
  the same checked content and seed. Existing active tasks are reused unchanged.
- Task cameras use the mounted object's world position. They frame reading pieces
  and the actual form bounds, including landscape. Occlusion handling excludes
  the mechanism itself. The existing sharp DOM text and full viewport are retained.

## Creature size and contact

- The supplied models retain their existing height normalization and animations.
  No creature or gate is resized to fit a task camera.
- Each adopted form derives an oriented torso capsule from its rest bounds and
  normalized height. It replaces the single level-only collision radius for solid
  contact. Decorative wing/tail reach remains separate from solid torso contact.
- This shape now participates in trees and solid objects, route boundaries,
  rival bodies and charge attacks, poison, boulders, thorns and spore rings.
  Turning a long body into a solid is rejected.
- Guardian movement uses the actual body for arena-wall containment and boss
  separation. Beam, falling-impact and quake checks use that same body shape.
- Growth checks nearby safe support when the new body overlaps a solid. Retry
  selection also checks the measured body near poison and hazard lanes. Neither
  action advances a task or awards progress.
- Full silhouette bounds remain in coin pickup and camera framing. Contact shadows
  use the resulting body radius; the long-body near-wall camera fallback is wider.

The capsule is a gameplay approximation derived from rest bounds, not per-triangle
animated collision. Authored foot planting and existing jump/attack clips remain
as supplied by the previous build. This release does not claim a new rigging pass.

## Compatibility and contents

All 44 unit journeys, 20 activity formats, four partners, Relaxed/Challenge modes,
partial tasks, existing checkpoints, unlocks, wallets and progress imports remain.
Coins remain separate from English progression. All 13 runtime data files and
1,199 creature/audio/image/other media files are byte-identical to v0.38.0.

## Validation

- Full automated suite: 484 checks passed.
- Updated contact/retry regression run: 32 checks passed.
- New tests cover all twenty permanent gate identities, chapter-boundary retention,
  partial-work reload, mounted portrait/landscape geometry, own-object occlusion,
  full-size folded leaves, oriented contact, safe growth, guardian clearance,
  solid-aware turning and approach-preview selection.
- All 44 real GLBs were loaded for bounds, normalized height, moving jumps, coin
  reach and arena containment. Their full bounds were projected in mounted sentence
  and question-matching shots in portrait and landscape.
- Label audit: 9,486 labels; zero predicted overflows. This is a layout estimate,
  not physical-device visual acceptance.
- The prebuilt runtime passes the production build validator. Both delivery ZIPs
  are checked for CRC errors, duplicate entries, entry points and runtime parity.

Live 3D preview was attempted. The managed browser reports GL_VENDOR/GL_RENDERER
Disabled and cannot create a WebGL context. Real-phone touch feel, rendered
appearance, animation contact and FPS remain unverified. No phone-performance or
visual-quality acceptance is claimed from these automated checks.

## Deploy

For Netlify manual deploy, extract `Maxima-v0.39.0-Netlify-Drop.zip` and upload the
folder containing `index.html` directly. It includes the complete prebuilt game.

For a repository deploy, extract `Maxima-v0.39.0-Source-Netlify.zip` at the repository
root. Retain `dist/`, `package.json`, `scripts/` and `netlify.toml`. Build command:
`npm run build`; publish directory: `dist`. The build command validates the included
output; it does not regenerate an omitted `dist` directory.

Recommended next acceptance pass: use actual portrait phones to approach, partially
solve, close and reopen each mechanism; finish a chapter and return to its restored
gates; compare cub and adult forms near trees, gate posts, hazards and boss walls.
