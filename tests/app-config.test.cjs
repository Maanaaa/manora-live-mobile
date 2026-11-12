// Garde-fous sur la configuration de l'app : permissions, plugins natifs, secrets.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = JSON.parse(read('app.json')).expo;

const pluginNames = app.plugins.map((p) => (Array.isArray(p) ? p[0] : p));

test('la caméra a un message de permission en français', () => {
  const camera = app.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-camera');
  assert.ok(camera, 'plugin expo-camera absent');
  assert.match(camera[1].cameraPermission, /caméra/);
});

test('les plugins natifs de la borne sont déclarés', () => {
  for (const name of ['expo-router', 'expo-camera', 'expo-secure-store', 'expo-screen-orientation']) {
    assert.ok(pluginNames.includes(name), `plugin ${name} manquant`);
  }
});

test("l'orientation n'est pas figée en portrait (la borne passe en paysage)", () => {
  assert.notEqual(app.orientation, 'portrait');
});

test('.env.example ne contient aucune vraie valeur sensible', () => {
  const env = read('.env.example');
  assert.doesNotMatch(env, /(token|secret|password|key)\s*=\s*\S+/i);
});

test('.env est ignoré par git', () => {
  assert.match(read('.gitignore'), /^\.env$/m);
});

test("la clé d'API de la borne passe par expo-secure-store", () => {
  const settings = read('src/lib/settings.ts');
  assert.match(settings, /expo-secure-store/);
  assert.match(settings, /SecureStore\.setItemAsync/);
});
