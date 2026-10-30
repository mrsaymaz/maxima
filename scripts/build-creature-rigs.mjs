// Optional asset-authoring pipeline. Normal Netlify builds only validate prebuilt assets.
import fs from'node:fs';import{execFileSync}from'node:child_process';import{verifyRuntimeRigs}from'./verify-rigs.mjs';
execFileSync('python3',['scripts/rig-missing.py'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/bake-anatomy-clips.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/refine-ravenclaw-walk.mjs'],{stdio:'inherit'});
fs.writeFileSync('docs/runtime-rig-audit-v0.27.0.json',JSON.stringify(verifyRuntimeRigs(),null,2)+'\n');
