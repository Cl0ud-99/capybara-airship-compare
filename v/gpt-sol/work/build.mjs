import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFile(path.join(root, 'work', name), 'utf8');
const [runtime, orbit, capybara, envelope, scene, template] = await Promise.all([
  read('three.module.min.js'), read('OrbitControls.js'), read('capybara.js'), read('balloon.js'), read('scene.js'), read('template.html')
]);

// Convert the pinned, official module exports into an inline namespace. No module
// requests are needed, so the delivered document works directly from file://.
const exportsMatch = runtime.match(/export\s*\{([^}]+)\};?\s*$/);
if (!exportsMatch) throw new Error('Unexpected Three.js export format.');
const exportsObject = exportsMatch[1].split(',').map(part => {
  const [local, exported] = part.trim().split(/\s+as\s+/);
  return `${exported || local}:${local}`;
}).join(',');
const runtimeInline = runtime.slice(0, exportsMatch.index) + `\nwindow.THREE={${exportsObject}};\n`;
const importMatch = orbit.match(/^import\s*\{([^}]+)\}\s*from\s*['"]three['"];?/);
if (!importMatch) throw new Error('Unexpected OrbitControls import format.');
const orbitBody = orbit.slice(importMatch[0].length).replace(/export\s*\{\s*OrbitControls\s*\};?\s*$/, '');
const controlsInline = `window.AirshipOrbitControls=((THREE)=>{const {${importMatch[1]}}=THREE;\n${orbitBody}\nreturn OrbitControls;})(window.THREE);`;
const scripts = {
  __RUNTIME_JS__: runtimeInline,
  __CONTROLS_JS__: controlsInline,
  __CAPYBARA_JS__: `${capybara}\n${envelope}`,
  __SCENE_JS__: scene
};
let html = template;
for (const [placeholder, source] of Object.entries(scripts)) {
  if (html.split(placeholder).length !== 2) throw new Error(`Expected exactly one ${placeholder}`);
  html = html.replace(placeholder, () => source.replace(/<\/script/gi, '<\\/script'));
}
if (/\b(?:src|href)\s*=\s*["'](?:https?:|\/\/)/i.test(html)) throw new Error('An external asset was referenced.');
if (/__(?:RUNTIME|CONTROLS|CAPYBARA|SCENE)_JS__/.test(html)) throw new Error('Unresolved source placeholder.');
await mkdir(path.join(root, 'outputs'), { recursive: true });
const target = path.join(root, 'outputs', 'index.html');
await writeFile(target, html, 'utf8');
console.log(JSON.stringify({ file: target, bytes: Buffer.byteLength(html), three: '0.170.0', sha256: crypto.createHash('sha256').update(html).digest('hex') }, null, 2));
