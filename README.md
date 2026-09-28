# Domirush

Le domino, à plusieurs, en ligne. Un vrai jeu de société numérique premium : table virtuelle, dominos vectoriels, animations naturelles, multijoueur en temps réel, et un mode solo contre l'IA pour tester sans attendre personne.

## Stack

- **Frontend** : Next.js (App Router) + React + TypeScript + Tailwind CSS + Framer Motion
- **Temps réel** : Socket.IO (serveur Node HTTP personnalisé, `server.ts`)
- **Moteur de jeu** : `src/game-engine` — TypeScript pur, sans dépendance UI ni réseau, entièrement testé (Vitest)
- **Base de données (optionnelle)** : PostgreSQL, pour l'historique des parties terminées uniquement
- **Déploiement** : Railway

## Démarrage local

```bash
npm install
cp .env.example .env
npm run dev
```

L'application (Next.js + WebSocket) tourne sur http://localhost:3000.

- `npm run dev` — serveur de développement (Next.js + Socket.IO, avec rechargement à chaud)
- `npm run build` — build de production Next.js
- `npm run start` — lance le serveur de production (`NODE_ENV=production`)
- `npm test` — exécute la suite de tests du moteur de jeu (Vitest)
- `npm run lint` — ESLint

## Variables d'environnement

Voir `.env.example`. Aucune n'est obligatoire en local : l'application démarre avec des valeurs par défaut raisonnables.

| Variable | Description |
|---|---|
| `PORT` | Port d'écoute du serveur (Railway le fournit automatiquement) |
| `HOST` | Adresse d'écoute (`0.0.0.0` par défaut) |
| `NODE_ENV` | `development` ou `production` |
| `DATABASE_URL` | Optionnel — active la journalisation des parties terminées dans Postgres |

## Architecture

```
src/
  game-engine/     Moteur de jeu pur (règles, distribution, scoring, IA) — testé, indépendant de l'UI
  server/          Autorité serveur : gestion des rooms, handlers Socket.IO, persistance optionnelle
  types/           Types partagés client/serveur (contrat des événements socket)
  hooks/           useSoloGame (IA locale) et useMultiplayerGame (socket) — même contrat de vue
  components/      Table, dominos SVG, main du joueur, HUD, modales
  lib/             Utilitaires partagés (sons synthétisés, identité joueur, layout des sièges, messages d'erreur)
  app/             Pages Next.js (accueil, solo, créer/rejoindre, salon, partie, règles)
server.ts          Serveur HTTP personnalisé : sert Next.js et attache Socket.IO dessus
```

Le moteur de jeu (`src/game-engine`) est un reducer pur (`gameReducer(state, action) → state`). Il est utilisé :
- **côté serveur**, comme unique source de vérité pour toutes les parties multijoueurs (le client ne peut jamais tricher : chaque coup est revalidé côté serveur) ;
- **côté client**, tel quel, pour le mode solo contre l'IA — aucun serveur requis pour y jouer.

## Mode solo

`/solo` permet de jouer une partie complète (2, 3 ou 4 joueurs, 50 ou 100 points) contre une IA locale, sans connexion réseau. C'est le moyen le plus rapide de tester l'intégralité des règles, de l'interface et des animations.

## Multijoueur

1. `/creer` — choisir un pseudo, un nombre de joueurs et un objectif de points, puis créer la table. Un code à 6 caractères est généré.
2. Partager le code (`/rejoindre`) avec les autres joueurs.
3. Le salon (`/salon/[code]`) affiche les joueurs connectés en temps réel ; l'hôte démarre la partie une fois la table complète.
4. La partie se joue sur `/partie/[code]`, synchronisée en temps réel via Socket.IO.

La reconnexion (perte de réseau, rafraîchissement de page) est gérée automatiquement : chaque appareil conserve un identifiant local (`localStorage`) qui lui permet de reprendre sa place à la table.

## Base de données

Domirush fonctionne entièrement sans base de données : toutes les parties actives vivent en mémoire côté serveur. Si une variable `DATABASE_URL` est fournie (par exemple via le plugin Postgres de Railway), chaque partie terminée est journalisée dans une table `games_history` (créée automatiquement au premier usage) — utile pour un futur tableau des scores ou des statistiques, mais jamais requis pour jouer.

## Déploiement sur Railway

1. Créer un nouveau projet Railway à partir de ce dépôt.
2. Railway détecte `npm run build` / `npm run start` automatiquement (ou configurer les commandes de build/start manuellement si besoin).
3. Railway fournit automatiquement `PORT` — aucune configuration supplémentaire n'est nécessaire pour que le serveur démarre.
4. (Optionnel) Ajouter un plugin PostgreSQL et copier son `DATABASE_URL` dans les variables d'environnement du service pour activer l'historique des parties.
5. Un endpoint `GET /health` renvoie `{ "status": "ok" }` — à utiliser comme healthcheck Railway.

Le serveur Socket.IO et le serveur Next.js tournent dans le **même** processus Node (`server.ts`), donc un seul service Railway suffit — pas besoin de service séparé pour le WebSocket.

## Tests

```bash
npm test
```

La suite couvre : génération et mélange du jeu de dominos, distribution (2/3/4 joueurs), détermination du premier joueur, validation des coups (pose, orientation, extrémités), pioche et passe, blocage de partie, scoring (fin de manche classique et manche bloquée), victoire à 50/100 points, et des parties complètes simulées IA-contre-IA pour 2, 3 et 4 joueurs vérifiant qu'aucune tuile n'est jamais dupliquée ou perdue.
