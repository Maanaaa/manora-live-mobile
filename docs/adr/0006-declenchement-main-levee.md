# ADR 0006 — Déclenchement de la photo par la main levée

- Statut : proposé (algorithme à choisir)
- Date : 2026-11-12

## Contexte

Sur la borne, le décompte se lance aujourd'hui en touchant l'écran ou par la règle « présence détectée » (capteur PIR, événement `booth.countdown`). On veut que les invités puissent aussi lancer la photo **sans toucher la tablette** : il suffit que quelqu'un lève la main.

## Exigence (cahier des charges)

En mode borne, l'app analyse en continu l'image de la caméra frontale. Dès qu'une personne lève la main au-dessus de sa tête, le décompte démarre automatiquement.

Critères d'acceptation :

1. Main levée au-dessus de la tête pendant environ 0,5 s → le décompte 3-2-1 démarre, exactement comme un appui sur l'écran.
2. Seulement sur l'écran d'accueil de la borne : pas de déclenchement pendant le décompte, la relecture ou l'envoi.
3. Pas de déclenchement en rafale : délai de quelques secondes après le retour à l'accueil.
4. Un geste ordinaire (se gratter la tête, passer devant la borne) ne déclenche pas.
5. Un indice visuel discret sur l'accueil (« Levez la main pour lancer la photo ») et un retour quand le geste est reconnu.
6. L'analyse se fait sur la tablette : aucune image n'est envoyée pour la détection (RGPD).
7. Le toucher et le capteur PIR continuent de fonctionner.

## Pistes

| Piste | Principe | Pour | Contre |
| --- | --- | --- | --- |
| A. MediaPipe Pose Landmarker dans une WebView | Le modèle BlazePose (JS + WASM) tourne dans `react-native-webview`, qui gère aussi l'aperçu caméra. Règle : poignet au-dessus du nez (repères 15/16 vs 0) pendant N images. | Compatible Expo Go (SDK 57), modèle éprouvé, très bonne précision sur la pose | La caméra passe par la WebView au lieu d'expo-camera ; modèle à embarquer pour ne pas dépendre d'Internet |
| B. VisionCamera + plugin de pose (MediaPipe ou ML Kit) | Analyse native image par image (frame processors) | Le plus fluide et le plus économe | Exige un development build : incompatible avec Expo Go |
| C. Détection de mouvement maison | Captures basse définition toutes les 300 ms, différence d'images dans la zone haute du cadre | Aucune dépendance | Ne distingue pas une main levée d'un autre mouvement ; décodage JPEG lourd en JS |

## Recommandation

Piste **A** tant que l'app tourne dans Expo Go. La règle « poignet au-dessus du nez pendant 0,5 s » couvre les critères 1 et 4 simplement. Si un development build est fait plus tard, la piste B prend le relais avec la même règle.

## Conséquences

- Nouvelle dépendance `react-native-webview` et modèle MediaPipe à embarquer dans l'app.
- L'aperçu caméra de la borne est à reprendre dans la WebView ; la capture de la photo doit rester de bonne qualité.
- La décision passera au statut « accepté » une fois la piste choisie et testée sur la tablette.
