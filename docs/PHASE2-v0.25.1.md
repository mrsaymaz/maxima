# Phase 2 first animation pass

Moving ranged casts retain 28% locomotion contribution, action weights ease in, and airborne transitions blend rather than snapping. Original GLBs, textures, skeletons, language data and saves are unchanged.

This is a limited first pass, not completion of Phase 2. The nineteen unrigged forms still require anatomically authored skin weights. Full mechanism, enemy, sound and elemental polish remains pending. Browser visual and physical-device testing remain pending.

Validation: build verification passed; targeted real-model animation checks and the new blend-normalization test passed. Two former exact-weight assertions now allow eased weights while retaining normalized mixer totals and recovery checks. Full suite results accompany the release after completion.
