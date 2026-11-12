# Manora Live — application mobile

Application Expo de Manora Live, la borne photo connectée de Manora (SAÉ IoT, BUT MMI 3).

Une seule app, deux modes :

- **Invité** (par défaut) : galerie en direct, récupération de ses photos, envoi de photos dans la galerie.
- **Borne** : la tablette posée sur le photobooth. Aperçu caméra en direct, décompte 3-2-1, relecture, puis QR code pour récupérer la photo. La règle « présence détectée » (capteur PIR) peut lancer le décompte à distance via le canal temps réel `booth`.

## Installation

```bash
npm install
cp .env.example .env   # renseigner EXPO_PUBLIC_API_URL
npx expo start
```

Sans `EXPO_PUBLIC_API_URL`, la borne fonctionne en mode démo : elle prend les photos sans les envoyer.

Les notifications push et la caméra demandent un development build :

```bash
npx expo run:android   # ou : eas build --profile development
```

## Passer une tablette en mode borne

1. Ouvrir **Réglages** depuis l'accueil.
2. Activer **Mode borne** et coller la clé d'API de la borne (créée dans le back-office).
3. Enregistrer : l'app démarre désormais directement sur la borne, en paysage et sans mise en veille.

Pour sortir du mode borne : appui long (1,5 s) sur le logo Manora.

## Structure

```
src/app/
  index.tsx      aiguillage invité / borne au lancement
  guest.tsx      accueil invité
  kiosk.tsx      la borne
  settings.tsx   réglages (mode borne, clé d'API)
src/components/  boutons, QR, décompte, état de connexion
src/lib/         API, réglages (expo-secure-store), temps réel, charte
```

## Contrat avec l'API

| Appel | Usage |
| --- | --- |
| `POST /photos` (multipart `photo`, `source=booth`, `Authorization: Bearer <clé>`) | envoi d'une photo de la borne, réponse `{ id, url }` |
| WebSocket `/ws?channel=booth&token=<clé>` | événements `booth.countdown`, `booth.sleep`, `booth.wake` |
