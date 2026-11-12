# ADR 0003 — CI GitHub Actions reprise de manora-app

- Statut : accepté
- Date : 2026-11-12

## Contexte

Le projet `manora-app` (GitLab de l'IUT) a déjà une CI éprouvée : install, qualité (lint, types, tests), sécurité (CVE, secrets), SonarQube. Manora Live est sur GitHub.

## Décision

`.github/workflows/ci.yml` reproduit cette CI avec les équivalents GitHub :

| GitLab | GitHub |
| --- | --- |
| `lint` | `npm run lint` (expo lint) |
| `typecheck` | `tsc --noEmit`, en recréant `expo-env.d.ts` |
| `test` + rapport JUnit | `node --test`, `junit.xml` en artefact |
| `osv-scanner` (non bloquant) | même image Docker, `continue-on-error` |
| template Secret-Detection | gitleaks |
| `sonarqube-check` si `SONAR_TOKEN` | SonarSource/sonarqube-scan-action si le secret `SONAR_TOKEN` existe |

Déclenchement : push sur `main`, pull requests, lancement manuel.

## Conséquences

- Pour activer Sonar : ajouter le secret `SONAR_TOKEN` (et la variable `SONAR_HOST_URL` si ce n'est pas SonarCloud), puis vérifier `sonar-project.properties`.
- Les tests sont en CommonJS (`tests/*.test.cjs`) pour tourner avec `node --test` sans outil de plus.
