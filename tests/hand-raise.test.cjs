// Règle « main levée » (ADR 0006) : le fichier TypeScript est transpilé à la volée.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/hand-raise.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('module', 'exports', outputText)(mod, mod.exports);
const { isHandRaised, anyHandRaised, createHandRaiseTracker } = mod.exports;

// Pose debout, bras le long du corps (y augmente vers le bas).
function pose(overrides = {}) {
  const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.9, visibility: 0.9 }));
  p[0] = { x: 0.5, y: 0.3, visibility: 0.99 }; // nez
  p[11] = { x: 0.6, y: 0.45, visibility: 0.95 }; // épaule gauche
  p[12] = { x: 0.4, y: 0.45, visibility: 0.95 }; // épaule droite
  p[13] = { x: 0.65, y: 0.6, visibility: 0.9 }; // coude gauche
  p[14] = { x: 0.35, y: 0.6, visibility: 0.9 }; // coude droit
  p[15] = { x: 0.65, y: 0.75, visibility: 0.9 }; // poignet gauche
  p[16] = { x: 0.35, y: 0.75, visibility: 0.9 }; // poignet droit
  for (const [i, v] of Object.entries(overrides)) p[i] = { ...p[i], ...v };
  return p;
}

test('bras le long du corps : pas de main levée', () => {
  assert.equal(isHandRaised(pose()), false);
});

test('bras droit tendu au-dessus de la tête : main levée', () => {
  assert.equal(isHandRaised(pose({ 14: { y: 0.3 }, 16: { y: 0.1 } })), true);
});

test('bras gauche levé : main levée', () => {
  assert.equal(isHandRaised(pose({ 13: { y: 0.32 }, 15: { y: 0.12 } })), true);
});

test('se gratter la tête (coude sous l’épaule) : pas de déclenchement', () => {
  assert.equal(isHandRaised(pose({ 14: { y: 0.5 }, 16: { y: 0.2 } })), false);
});

test('poignet à hauteur du nez seulement : pas de déclenchement', () => {
  assert.equal(isHandRaised(pose({ 14: { y: 0.4 }, 16: { y: 0.29 } })), false);
});

test('poignet peu visible : ignoré', () => {
  assert.equal(isHandRaised(pose({ 14: { y: 0.3 }, 16: { y: 0.1, visibility: 0.2 } })), false);
});

test('plusieurs personnes : une seule main levée suffit', () => {
  assert.equal(anyHandRaised([pose(), pose({ 16: { y: 0.1 }, 14: { y: 0.3 } })]), true);
  assert.equal(anyHandRaised([]), false);
});

test('le geste doit être tenu 0,5 s', () => {
  const tracker = createHandRaiseTracker(500);
  assert.equal(tracker.update(true, 0), false);
  assert.equal(tracker.update(true, 300), false);
  assert.equal(tracker.update(true, 520), true);
});

test('une interruption remet le compteur à zéro', () => {
  const tracker = createHandRaiseTracker(500);
  tracker.update(true, 0);
  tracker.update(false, 300);
  assert.equal(tracker.update(true, 400), false);
  assert.equal(tracker.update(true, 800), false);
  assert.equal(tracker.update(true, 950), true);
});

test('un seul déclenchement par geste, réarmé en baissant la main', () => {
  const tracker = createHandRaiseTracker(500);
  tracker.update(true, 0);
  assert.equal(tracker.update(true, 600), true);
  assert.equal(tracker.update(true, 1500), false);
  tracker.update(false, 1600);
  tracker.update(true, 1700);
  assert.equal(tracker.update(true, 2300), true);
});
