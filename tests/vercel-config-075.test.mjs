// Vercel (0.75.0): vercel.json carries the same build settings and cache headers as netlify.toml, so the game can be
// deployed to either host. Change both files together.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const toml = fs.readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8'),
  vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const netlifyRules = [
  ...toml.matchAll(
    /\[\[headers\]\]\s*\n\s*for = "([^"]+)"\s*\n\s*\[headers\.values\]\s*\n((?:\s*[A-Za-z-]+ = "[^"]*"\s*\n?)+)/g,
  ),
].map(m => ({
  source: m[1].replace(/\*$/, '(.*)'),
  headers: [...m[2].matchAll(/([A-Za-z-]+) = "([^"]*)"/g)].map(h => ({ key: h[1], value: h[2] })),
}));

test('vercel.json builds like netlify.toml: check dist/ and publish it as it is', () => {
  assert.equal(vercel.buildCommand, 'npm run verify');
  assert.equal(vercel.outputDirectory, 'dist');
  assert.equal(vercel.framework, null, 'a plain static site, no framework preset');
  assert.match(toml, /command = "npm run verify"/);
  assert.match(toml, /publish = "dist"/);
});

test('vercel.json has the same cache headers as netlify.toml', () => {
  assert.equal(netlifyRules.length, 13);
  assert.deepEqual(vercel.headers, netlifyRules);
  const rule = s => vercel.headers.find(h => h.source === s)?.headers[0].value;
  assert.equal(rule('/sw.js'), 'no-cache', 'new builds reach players');
  assert.equal(rule('/assets/creatures-web/(.*)'), 'public, max-age=31536000, immutable');
  for (const h of vercel.headers) assert.match(h.source, /^\/[A-Za-z0-9/._-]*(\(\.\*\))?$/, h.source);
});
