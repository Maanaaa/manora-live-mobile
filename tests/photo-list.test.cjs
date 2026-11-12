// Logique pure de la galerie invité (src/lib/photo-list.ts), transpilée à la volée avec TypeScript.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/lib/photo-list.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const lib = {};
new Function('exports', outputText)(lib);
const { mergePhotos, removePhoto, parseEventCode } = lib;

const photo = (id, createdAt) => ({ id, createdAt });

test('les photos sont triées de la plus récente à la plus ancienne', () => {
  const list = mergePhotos([photo('a', '2026-11-12T20:00:00Z')], [photo('b', '2026-11-12T21:00:00Z')]);
  assert.deepEqual(list.map((p) => p.id), ['b', 'a']);
});

test('une photo reçue deux fois (API puis temps réel) n’apparaît qu’une fois', () => {
  const a = photo('a', '2026-11-12T20:00:00Z');
  const list = mergePhotos([a], [{ ...a, authorName: 'Léa' }]);
  assert.equal(list.length, 1);
  assert.equal(list[0].authorName, 'Léa');
});

test('photo.deleted retire la photo, sans toucher la liste si elle est absente', () => {
  const list = [photo('a', '2026-11-12T20:00:00Z'), photo('b', '2026-11-12T19:00:00Z')];
  assert.deepEqual(removePhoto(list, 'a').map((p) => p.id), ['b']);
  assert.equal(removePhoto(list, 'z'), list);
});

test('le code est lu depuis le lien du QR de la borne', () => {
  assert.equal(parseEventCode('manoralive://join?code=MARIAGE24'), 'MARIAGE24');
  assert.equal(parseEventCode('https://live.manora.fr/join?foo=1&code=ab%2012'), 'ab12');
});

test('le code saisi est nettoyé et validé', () => {
  assert.equal(parseEventCode('  MAR IAGE-24 '), 'MARIAGE-24');
  assert.equal(parseEventCode(''), null);
  assert.equal(parseEventCode('a'), null);
  assert.equal(parseEventCode('code<script>'), null);
});
