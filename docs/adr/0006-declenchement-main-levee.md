# ADR 0006 — Déclenchement de la photo par la main levée

- Statut : accepté (piste A)
- Date : 2026-11-12

## Contexte

Sur la borne, le décompte se lance aujourd'hui en touchant l'écran ou par la règle « présence détectée » (capteur PIR, événement `booth.countdown`). On veut que les invités puissent aussi lancer la photo **sans toucher la tablette** : il suffit que quelqu'un lève la main.

## Exigence (cahier des charges)

En mode borne, l'app analyse en continu l'image de la caméra frontale. Dès qu'une personne lève la main au-dessus de sa tête, le décompte démarre automatiquement.

Critères d'acceptation :

1. Main levée au-dessus de la tête pendant environ 0,5 s → le décompte 3-2-1 démarre, exactement comme un appui sur l'écran.
2. Seulement sur l'écran d'accueil de la borne : pas de déclenchement pendant le décompte, la relecture ou l'envoi.
3. Pas de déclenchement en rafale : délai de quelques secondes après le retour à l'accueil.
4. Un geste ordinaire (passer devant la borne, bras à hauteur de poitrine) ne déclenche pas. Assoupli le 2026-11-12 à la demande de Théo : lever la main suffit, un geste près de la tête peut donc déclencher.
5. Un indice visuel discret sur l'accueil (« Levez la main pour lancer la photo ») et un retour quand le geste est reconnu.
6. L'analyse se fait sur la tablette : aucune image n'est envoyée pour la détection (RGPD).
7. Le toucher et le capteur PIR continuent de fonctionner.

## Pistes

| Piste | Principe | Pour | Contre |
| --- | --- | --- | --- |
| A. MediaPipe Pose Landmarker dans une WebView | Le modèle BlazePose (JS + WASM) tourne dans `react-native-webview`, qui gère aussi l'aperçu caméra. Règle : poignet au-dessus du nez (repères 15/16 vs 0) pendant N images. | Compatible Expo Go (SDK 57), modèle éprouvé, très bonne précision sur la pose | La caméra passe par la WebView au lieu d'expo-camera ; modèle à embarquer pour ne pas dépendre d'Internet |
| B. VisionCamera + plugin de pose (MediaPipe ou ML Kit) | Analyse native image par image (frame processors) | Le plus fluide et le plus économe | Exige un development build : incompatible avec Expo Go |
| C. Détection de mouvement maison | Captures basse définition toutes les 300 ms, différence d'images dans la zone haute du cadre | Aucune dépendance | Ne distingue pas une main levée d'un autre mouvement ; décodage JPEG lourd en JS |

## Décision

Piste **A**, choisie par Théo le 2026-11-12.

- Règle (`src/lib/hand-raise.ts`, testée dans `tests/hand-raise.test.cjs`) : seule la main compte. Elle est levée quand l'un de ses repères (poignet, index, auriculaire ou pouce) passe au-dessus de l'épaule, avec une marge d'un quart de la largeur des épaules ; le coude est ignoré. Repères visibles à plus de 50 %. Le geste doit être tenu 0,5 s ; un seul déclenchement par geste, réarmé en baissant la main. Plusieurs personnes peuvent être dans le cadre (3 au plus). Première version (poignet au-dessus du nez ET coude au-dessus de l'épaule) jugée trop exigeante aux essais : il fallait tendre le bras.
- Modèle : MediaPipe Pose Landmarker lite (`@mediapipe/tasks-vision` 0.10.14), chargé depuis le CDN jsDelivr et Google Storage.
- Navigateur (`hand-raise-detector.web.tsx`) : analyse directe d'un flux webcam caché, environ 10 images/s.
- Tablette (`hand-raise-detector.tsx`) : iOS n'accepte qu'une session caméra, donc la WebView n'ouvre pas la caméra. L'app prend une image basse qualité toutes les 250 ms avec la caméra de la borne et l'envoie à une WebView invisible qui fait tourner MediaPipe.
- L'analyse ne tourne que sur l'accueil, 3 s après y être revenu. Le décompte affiche « Main levée, c'est parti » quand le geste a lancé la photo, et l'accueil invite à lever la main dès que le modèle est prêt.

## Conséquences

- Nouvelle dépendance `react-native-webview` (incluse dans Expo Go).
- Le modèle est téléchargé au lancement : il faut Internet sur la tablette. L'embarquer dans l'app supprimerait cette dépendance.
- Version tablette non testée sur appareil : la fréquence des captures (250 ms) est à ajuster selon la fluidité de l'aperçu.
- Si un development build est fait plus tard, la piste B peut remplacer le détecteur tablette en gardant la même règle.
