# Maxima v0.40.0 — expressive combat and language feedback

## Combat

- Stronger, distinct additive cast accents for Air, Fire, Nature and Water, still
  synchronized to the existing release time. Existing skeletal clips, supplied
  geometry, creature normalization and collision profiles are retained.
- Rumblebud braces more clearly; Brambleguard's body and armour register a hit;
  Mistcap lifts and settles its cap with charge and pulse. Hurt recoil follows
  the incoming hit direction. Recovery has a brief, damped settling motion.
- Guarded hits trigger a restrained reaction and actionable advice: wait for a
  Rumblebud recovery, circle behind Brambleguard, or jump Mistcap's ring and cast
  when its cap lowers. Advice uses the existing trail hint and expires. Active
  danger guidance takes precedence over these short response messages.
- The partner has reversible bone accents for success, being blocked and hurt.
  They do not scale the model, translate the navigation body or lock controls.
  They yield to attacks and airborne motion. Reduced motion lowers their strength.
- The guardian has a short torso/head hit response. Its attack cadence, warning
  geometry, damage windows, collision bounds and English finisher are unchanged.
- Runtime reaction and advice state stays transient. Retries clear old advice;
  no combat presentation fields are added to existing saves.

This is a presentation and feedback pass using the existing rigs. It does not
claim newly authored full-body animation clips or a new rigging pass.

## Language feedback

- Wrong answers no longer automatically display the large full-answer correction
  card. The current format supplies a concise learning cue in the existing dock.
  The attempted piece receives a dashed retry outline where applicable. Correct
  work is retained, and mistake/review recording remains in place.
- Hint first gives guidance. A second explicit Show answer request supplies the
  worked cue and outlines the appropriate piece on the actual mechanism. Long
  answers remain readable on their plates rather than being duplicated in the
  narrow dock. Existing Challenge-mode hint eligibility is retained.
- WH guidance separates context from the actual question. It distinguishes
  frequency, amount, age, duration, distance, ownership, place, time and other
  question purposes, with short Turkish equivalents. The guardian's question
  finisher uses these cues too.
- Grammar hints only name specific rules when the checked template supports them:
  forms of be, subject/verb matching, vowel sounds, be + -ing, comparison and
  past-time clues. Other sentences get a neutral subject/verb/time check.
- Correct feedback uses the item just completed, rather than the next shuffled
  round. It names fitted sentence fragments, repaired sentences, connected
  meanings, answered question types, corrected spelling and ordered deliveries.
- Compact confirmation messages avoid repeating very long sentences. Full checked
  language on the task objects is never truncated or replaced by these messages.
- Feedback is politely announced for assistive technology; text and outline shape
  distinguish retry and answer support alongside colour. Decorative hint pulsing
  respects reduced motion.
- Coaching state is bounded and temporary. It changes no saved answer identities,
  practice order, accepted work, level progression, XP or coin rewards.

## Mobile layout

The feedback uses the measured bottom dock in portrait and the existing right
side dock in landscape. It adds no panel over the reading plates. Success details
are shortened; a requested worked answer stays mounted on the mechanism.

Browser checks used the actual production CSS and feedback markup in isolated
UI fixtures, with no 3D scene:

| Layout | Observed dock | Result |
| --- | --- | --- |
| 390 × 844 retry | About 105 px high at the bottom | Text fits; controls 44 px high |
| 844 × 390 retry | Existing 156 px side dock | Text fits; all three controls visible, 44 px high |
| 320 × 568 sentence success | About 102 px high at the bottom | Complete sample fits; controls 44 px high |

An initial landscape width restriction was found during this check and corrected.
Temporary UI fixtures were removed from the delivered game.

## Verification and compatibility

- Full automated suite: 497 checks passed.
- Final focused feedback, real-app and animation suite: 39 checks passed.
- New language tests exercise all 44 units and all 20 formats through wrong,
  guided, explicitly supported and successful actions without changing saved
  answer data. App tests verify help and partial-work persistence across reload.
- All 44 actual runtime skeletal forms were loaded, including derived glTF rigs.
  Success/hurt/blocked accents were exercised repeatedly, skinned bounds checked,
  and joint rotations restored exactly. Model scales and positions remain stable.
- Enemy presentation tests retain geometry/material identities and runtime data;
  live projectile tests verify guarded advice, hit direction and retry clearing.
- Label audit: 9,486 labels, zero predicted overflows. This estimates task-plate
  layout and does not establish real-phone rendering or every coaching layout.
- Production static build validation and ZIP integrity/runtime parity checks pass.
- All 13 runtime data files and 1,199 media files remain byte-identical to v0.39.0.

The managed browser cannot create a WebGL context (graphics vendor/renderer are
disabled). The full production page reaches its graphics-unavailable message.
Live 3D appearance, animation feel, real-phone multi-touch and FPS remain unverified.
UI-only browser measurements and automated geometry tests are not device acceptance.

All existing saves, four creatures, 44 unit journeys, 20 formats, both modes,
continuous gates, measured creature contact, checkpoints and rewards are retained.

## Netlify

Extract `Maxima-v0.40.0-Netlify-Drop.zip` and upload the folder whose immediate
contents include `index.html`, `assets/` and `data/` for manual deploy.

For repository deployment, the complete source ZIP includes prebuilt `dist/`,
`package.json`, scripts and `netlify.toml`: build `npm run build`, publish `dist`.
The command validates the included output; it does not recreate an omitted dist.

Next acceptance pass: play on real phones with each partner, compare blocked and
successful attacks, try a mistake before and after accepted language work, request
both hint stages, and reopen the task in portrait and landscape. Check that cues
stay readable while the creature and restored mechanism remain visible.
