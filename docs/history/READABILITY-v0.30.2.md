# Maxima v0.30.2 · Complete questions and answers

Landscape task mechanisms now use wider native plates and shorter rows, supported by rails connected to their original frame. Geometry is rebuilt for the viewport rather than stretching models. Rotating a device reflows the same task and preserves its mechanical drive state. Portrait overview geometry is preserved.

Matching tasks provide **Read closely**. Select a question or beginning to present it on a full-width plate with all three answer plates simultaneously visible. Correctly matched answers remain marked. Other questions temporarily leave the reading view; **All pairs** restores the overview, and selecting another question uses its own close-reading arrangement. This is a physical mechanism layout, not a quiz popup. Closing/reloading a task preserves accepted work; the presentation toggle itself is temporary and adds no hint or mistake penalty.

The gate-review page has the same control. Use task-preview.html on a phone, select long question-answer pairs, enable Read closely and compare all answers. Rotate the phone, match a pair, return to All pairs and confirm that progress is preserved.

Validation: full automated suite 400/400 passed. After the final adjustment preserving portrait overview geometry, 11 focused reading/camera tests passed and build validation passed. Tests cover all units and formats for finite wide layouts, all-unit selected-question comparison, rotation/inspection checkpoint preservation, guardian camera offsets, occlusion and opening-shot stability.

Browser font/layout audit: 9,757 labels across initial landscape boards at 844 × 390 had zero scrolling labels, escaped ink or overlapping active targets. At 320 × 568, the close-reading sample had 7,997 labels with zero scrolling labels, escaped ink or overlapping active targets. Samples span all 44 units and 20 formats at language Levels 0 and 10; close reading selects the first question in each sampled matching board. These results do not cover all random seeds, questions, saved imports or browser fonts. The containment/scroll fallback remains for unusual text.

The available preview browser cannot render WebGL. No claim of physical-phone, Safari, rendered-mechanism visual acceptance or sustained FPS testing is made. All creature/rig/media/language bytes and save formats are unchanged.
