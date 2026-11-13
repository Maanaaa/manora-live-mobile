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

test('les plugins natifs de la borne et du mode invité sont déclarés', () => {
  for (const name of [
    'expo-router',
    'expo-camera',
    'expo-secure-store',
    'expo-screen-orientation',
    'expo-image-picker',
    'expo-media-library',
  ]) {
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

test('les permissions photos du mode invité sont en français', () => {
  const picker = app.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-image-picker');
  const library = app.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-media-library');
  assert.match(picker[1].cameraPermission, /caméra/);
  assert.match(picker[1].photosPermission, /photos/);
  assert.equal(picker[1].microphonePermission, false);
  assert.match(library[1].savePhotosPermission, /enregistre/);
});

test("le jeton invité est stocké avec expo-secure-store", () => {
  const settings = read('src/lib/settings.ts');
  assert.match(settings, /guestSession: 'manora\.guestSession'/);
  assert.match(settings, /setGuestSession/);
});

test('les liens manoralive://join ouvrent l’écran pour rejoindre un événement', () => {
  assert.equal(app.scheme, 'manoralive');
  assert.ok(fs.existsSync(path.join(root, 'src/app/join.tsx')));
});

test('mises à jour over the air : jamais appliquées d’office (bouton « Installer »)', () => {
  assert.equal(app.updates.checkAutomatically, 'NEVER');
  assert.match(app.updates.url, /^https:\/\/u\.expo\.dev\//);
  const banner = read('src/components/update-banner.tsx');
  assert.match(banner, /checkForUpdateAsync/);
  assert.match(banner, /fetchUpdateAsync/);
  assert.match(read('src/app/_layout.tsx'), /<UpdateBanner \/>/);
});

test('notifications push : plugin déclaré, inscription de l’invité, ouverture au toucher', () => {
  assert.ok(pluginNames.includes('expo-notifications'), 'plugin expo-notifications manquant');
  assert.match(read('src/lib/push.ts'), /getExpoPushTokenAsync/);
  assert.match(read('src/app/(guest)/_layout.tsx'), /registerForPush/);
  assert.match(read('src/app/_layout.tsx'), /useNotificationRouting\(\)/);
});
