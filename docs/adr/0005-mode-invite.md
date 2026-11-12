# ADR 0005 — Mode invité

- Statut : accepté
- Date : 2026-11-12

## Contexte

Par défaut, l'app sert aux invités d'un événement : « on peut récupérer ses photos et surtout partager des photos avec la galerie live ». Ils arrivent le plus souvent en scannant le QR de la borne. L'API (ADR 0002) n'existe pas encore : l'app doit rester propre sans elle.

## Décision

- **Accès** : `src/app/join.tsx`, hors du groupe invité. Code saisi à la main ou lien profond `manoralive://join?code=…` (rejoint automatiquement). `POST /auth/guest { code }` ; la réponse `{ token, guest, event }` est stockée dans expo-secure-store (`manora.guestSession`). Le code est envoyé sans espaces, la casse est laissée à l'API. « Quitter l'événement » efface la session.
- **Aiguillage** (`src/app/index.tsx`) : mode borne → `/kiosk` ; sinon session invitée → `/gallery`, sinon `/join`. Le groupe `(guest)` redirige aussi vers `/join` sans session, et une réponse 401 renvoie vers `/join` (accès expiré).
- **Navigation** : `src/app/(guest)/_layout.tsx` (pile + contexte invité) contient `(tabs)/` — Galerie (`gallery`), Mes photos (`mine`, `GET /photos?mine=1`), Partager (`share`) — et la fiche `photo/[id]` en plein écran. Réglages accessibles depuis l'en-tête.
- **Temps réel** : une seule WebSocket `/ws?token=` par session invitée (`useLiveSocket`, partagé avec la borne). `photo.created` et `photo.deleted` mettent à jour toutes les listes ouvertes ; après une coupure, la première page est rechargée pour rattraper les photos manquées.
- **Pagination** : `GET /photos?after=<id>` avec l'id de la dernière photo affichée ; une page vide marque la fin. Fusion sans doublon, plus récentes d'abord (`src/lib/photo-list.ts`, testé).
- **Partage** : expo-image-picker (caméra ou photos du téléphone, JPEG qualité 0,85), aperçu, puis `POST /photos` multipart `photo` + `source=guest`. La photo revient dans la galerie par `photo.created`.
- **Fiche photo** : affichage de `url` (avec `thumbUrl` en attendant), enregistrement sur le téléphone (expo-file-system télécharge dans le cache, puis expo-media-library l'ajoute à la galerie, accès en écriture seule), suppression si `mine`. Sur le web, la photo s'ouvre dans un nouvel onglet.
- **Sans API** : chaque écran affiche un message clair (« serveur non configuré », « hors ligne », erreur du serveur), jamais de fausses données.

## Conséquences

- Le mode invité demande un development build pour la caméra et l'enregistrement dans la galerie (permissions déclarées dans `app.json`).
- Points du contrat à confirmer côté API : sens de `after` (photos plus anciennes que l'id), taille de page, et `url` d'une photo de la borne, qui est une page publique : la fiche et l'enregistrement ont besoin d'une URL d'image.
