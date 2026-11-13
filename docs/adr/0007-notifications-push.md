# ADR 0007 — Notifications push

- Statut : accepté
- Date : 2026-11-13

## Contexte

Le sujet exige des notifications push déclenchées par les règles. Théo veut aussi prévenir les invités quand une photo arrive dans la galerie en direct. L'API sait envoyer par Expo Push et enregistrer les jetons (`POST /push-tokens`), mais l'app ne s'inscrivait pas.

## Décision

- `expo-notifications` : à l'ouverture du mode invité, l'app demande l'autorisation, obtient le jeton Expo Push (avec le `projectId` EAS) et l'envoie à l'API (`src/lib/push.ts`). Canal Android `default` (importance haute).
- Toucher une notification ouvre l'écran indiqué par `data.url` (ex. `/gallery`), même app fermée (`useNotificationRouting` dans `src/app/_layout.tsx`).
- App ouverte : la notification s'affiche en bandeau, sans son.
- Web : désactivé (`push.web.ts`).
- Côté API (ADR 0008 de l'API) : notification « nouvelles photos » regroupée, au plus une toutes les 5 minutes par téléphone.

## Conséquences

- **Android uniquement** pour l'instant : sur iPhone, il faut un compte Apple Developer payant.
- Firebase : projet `manora-live`, app Android `fr.manora.live`. `google-services.json` n'est pas dans le dépôt (clé d'API Google, refusée par gitleaks) : il est lu en local à la racine de l'app, et fourni aux builds EAS par la variable d'environnement de type fichier `GOOGLE_SERVICES_JSON` (`app.config.js`).
- La clé de compte de service FCM v1 doit être chargée dans EAS (`eas credentials` → Android → Push Notifications FCM V1) pour qu'Expo puisse envoyer. Sans elle, ou sans Firebase dans le build, l'inscription échoue en silence (`unavailable`).
- `expo-notifications` est un module natif : un nouvel APK est nécessaire. Pas de push dans Expo Go sur Android.
