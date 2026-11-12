# ADR 0001 — Une seule app Expo, deux modes : invité et borne

- Statut : accepté
- Date : 2026-11-12

## Contexte

Le sujet impose une application mobile Expo (SDK récent, TypeScript, expo-router, jeton dans expo-secure-store). Manora Live a deux usages sur appareil mobile :

- les invités d'un événement, qui récupèrent leurs photos et partagent les leurs dans la galerie en direct ;
- la tablette posée sur le photobooth, où les gens déclenchent leur photo et se voient à l'écran.

## Décision

Une seule app, `manora-live-mobile`, avec deux modes :

- **Invité** (par défaut) : rejoindre l'événement par son code (QR), galerie en direct, mes photos, envoi de photos.
- **Borne** : activé dans les Réglages avec la clé d'API de la borne (créée dans le back-office). La tablette démarre alors directement sur `/kiosk`, en paysage, sans mise en veille. Sortie : appui long (1,5 s) sur le logo.

Le mode est stocké dans expo-secure-store (`manora.mode`), comme la clé de la borne (`manora.boothKey`) et le jeton invité.

La borne écoute le temps réel : l'événement `booth.countdown` (règle « présence détectée » sur le capteur PIR) lance le décompte.

Sans `EXPO_PUBLIC_API_URL`, la borne fonctionne en mode démo : elle prend les photos sans les envoyer.

## Conséquences

- Un seul build à installer, sur la tablette comme sur les téléphones.
- Les routes sont séparées : `src/app/kiosk.tsx` pour la borne, `src/app/(guest)/` pour l'invité.
- Le Raspberry Pi reste sans écran, comme l'exige le sujet : l'affichage de la borne est sur la tablette.
