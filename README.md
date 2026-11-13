# Manora Live — application mobile

Application Expo de Manora Live, la borne photo connectée de Manora (SAÉ IoT, BUT MMI 3).

Une seule app, deux modes :

- **Invité** (par défaut) : rejoindre l'événement (code ou QR de la borne), galerie en direct, mes photos, partage de photos dans la galerie.
- **Borne** : la tablette posée sur le photobooth. Aperçu caméra en direct, décompte 3-2-1, relecture, puis QR code pour récupérer la photo. La règle « présence détectée » (capteur PIR) peut lancer le décompte à distance via le canal temps réel `booth`.

## Installation

```bash
npm install
cp .env.example .env   # renseigner EXPO_PUBLIC_API_URL
npx expo start
```

Sans `EXPO_PUBLIC_API_URL`, la borne fonctionne en mode démo : elle prend les photos sans les envoyer, et le mode invité affiche « serveur non configuré ».

Les notifications push et la caméra demandent un development build :

```bash
npx expo run:android   # ou : eas build --profile development
```

## Mode invité

1. L'invité scanne le QR de la borne (lien `manoralive://join?code=…`) ou saisit le code de l'événement.
2. **Galerie** : toutes les photos, en direct (nouvelles photos et suppressions sans rafraîchir), tirer pour rafraîchir.
3. **Mes photos** : les photos qu'il a partagées.
4. **Partager** : prendre une photo ou en choisir une, aperçu, envoi dans la galerie.
5. Toucher une photo l'ouvre en plein écran : enregistrer sur le téléphone, supprimer si c'est la sienne.

L'en-tête donne accès aux Réglages et à « Quitter l'événement ». Détails : [ADR 0005](docs/adr/0005-mode-invite.md).

## Passer une tablette en mode borne

1. Ouvrir **Réglages** depuis l'accueil.
2. Activer **Mode borne** et coller la clé d'API de la borne (créée dans le back-office).
3. Enregistrer : l'app démarre désormais directement sur la borne, en paysage et sans mise en veille.

Pour sortir du mode borne : appui long (1,5 s) sur le logo Manora.

## Structure

```
src/app/
  index.tsx            aiguillage borne / invité au lancement
  join.tsx             rejoindre un événement (code ou lien manoralive://join?code=…)
  (guest)/
    _layout.tsx        session invitée, temps réel, pile
    (tabs)/            onglets : gallery, mine, share
    photo/[id].tsx     fiche photo plein écran
  kiosk.tsx            la borne
  settings.tsx         réglages (mode borne, clé d'API)
src/components/        boutons, icônes, grille de photos, états, QR, décompte
src/lib/               API, réglages (expo-secure-store), temps réel, galerie, charte
```

## Contrat avec l'API

| Appel | Usage |
| --- | --- |
| `POST /photos` (multipart `photo`, `source=booth`, `Authorization: Bearer <clé>`) | envoi d'une photo de la borne, réponse `{ id, url }` |
| WebSocket `/ws?token=<clé>` | événements `booth.countdown`, `booth.sleep`, `booth.wake` |
| `POST /auth/guest` `{ code }` | l'invité rejoint l'événement, réponse `{ token, guest, event }` |
| `GET /photos?after=<id>&mine=1` | galerie et mes photos, plus récentes d'abord |
| `POST /photos` (multipart `photo`, `source=guest`) | partage d'une photo par un invité |
| `DELETE /photos/:id` | suppression de sa photo |
| WebSocket `/ws?token=<jeton invité>` | événements `photo.created`, `photo.deleted` |

## Compiler et mettre à jour (EAS)

Projet Expo : `@mana_uca/manora-live`.

| Commande | Effet |
| --- | --- |
| `npm run build:apk` | APK de production, canal de mises à jour **prod** (tablette de la borne) |
| `npm run build:preview` | APK de test, canal **dev** |
| `npm run update:prod -- --message "…"` | Mise à jour over the air des APK de production |
| `npm run update:dev -- --message "…"` | Mise à jour over the air des APK de test |

Les mises à jour ne sont jamais appliquées d'office : l'app vérifie au lancement, au retour au premier plan et toutes les 30 min, puis affiche un bandeau « Une mise à jour est disponible » avec **Installer** et **Plus tard** (`src/components/update-banner.tsx`, `checkAutomatically: NEVER`).

Une mise à jour over the air ne remplace que le JavaScript et les images : un changement de module natif ou de `version` dans `app.json` demande un nouvel APK (`runtimeVersion` suit la version de l'app). L'adresse de l'API (`EXPO_PUBLIC_API_URL`) est une variable d'environnement EAS.
