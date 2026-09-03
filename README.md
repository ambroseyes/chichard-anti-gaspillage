# Chichard — plateforme anti-gaspillage alimentaire

Chichard met en relation des commerçants camerounais et leurs clients autour des
produits proches de leur date limite : catalogue à prix réduit, paniers
Click & Collect, livraison, fidélité et défis communautaires.

Le dépôt contient deux applications :

| Dossier    | Rôle                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `src/`     | Interface web (React 18, Vite, Tailwind, TanStack Query)             |
| `server/`  | API et logique métier (Node 22, Express, Prisma, PostgreSQL 16)      |

## Démarrer

### Prérequis

- Node.js 22 ou supérieur
- PostgreSQL 16 (ou `docker compose up db`)

### Installation

```bash
# 1. Base de données et serveur
cd server
cp .env.example .env          # renseigner JWT_SECRET et PICKUP_TOKEN_SECRET
npm install
npx prisma migrate deploy
npm run seed                  # jeu de données de démonstration
npm run dev                   # http://localhost:4000

# 2. Interface web, dans un second terminal
cd ..
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:5173
```

Générer les deux secrets obligatoires :

```bash
openssl rand -hex 32
```

### Comptes de démonstration

`npm run seed` crée quatre comptes, mot de passe commun `chichard-demo-2026` :

| Adresse                    | Rôle                        |
| -------------------------- | --------------------------- |
| `admin@chichard.cm`        | administrateur, super-admin |
| `partenaire@chichard.cm`   | commerçant partenaire       |
| `livreur@chichard.cm`      | livreur                     |
| `client@chichard.cm`       | client                      |

### Avec Docker

```bash
docker compose up --build
# interface : http://localhost:8080   API : http://localhost:4000
```

## Architecture

### Le serveur est la seule autorité

Toute décision qui engage de l'argent, du stock ou un droit d'accès est prise
côté serveur. L'interface ne fait qu'afficher et proposer.

- **Autorisation** — `server/src/access/policies.js` décrit, pour chacune des 50
  entités, qui peut lire et écrire quoi. L'API générique
  (`/api/entities/:entity`) filtre chaque lecture selon la session, refuse les
  écritures non autorisées et rejette les champs pilotés par le serveur. Une
  opération absente du registre est interdite : le défaut est fermé.
- **Commande** — `POST /api/orders` relit les prix en base, vérifie et décrémente
  le stock sous condition SQL, consomme le coupon, ajoute les frais de
  livraison, trace un mouvement de stock et crédite les points, le tout dans une
  transaction. Le panier n'est vidé que si l'ensemble aboutit.
- **Paiement** — aucune commande n'est marquée payée sans une notification
  signée de l'opérateur mobile (`POST /api/payments/webhook`).
- **Retrait** — le code présenté au commerçant est signé (HMAC) et n'est stocké
  que sous forme de condensat. Il n'est affiché qu'une fois, au client.

### Modèle de données

Les entités sont décrites en JSON Schema dans `server/entities/`. C'est la
source de vérité : `prisma/schema.prisma` en est **généré**.

```bash
cd server
# après modification d'un fichier de server/entities/
npm run schema:generate
npx prisma migrate dev --name description_du_changement
```

La CI vérifie que le schéma généré correspond aux définitions : éditer
`schema.prisma` à la main fait échouer la construction.

### Tâches planifiées

`server/src/jobs/` remplace les automatisations de la plateforme précédente :
alertes de péremption (9 h, heure de Douala), alertes de stock bas,
réévaluation horaire de l'urgence et des prix conseillés, purge des jetons.
Un verrou en base évite qu'une tâche s'exécute deux fois avec plusieurs
instances du serveur.

### Assistance IA

`server/src/routes/ai.js` expose un catalogue fermé de tâches nommées. Chacune
construit son contexte depuis la base et impose un schéma de sortie. Le
navigateur choisit une tâche et fournit des paramètres validés : il ne compose
jamais de requête libre et ne détient aucune clé. Sans `ANTHROPIC_API_KEY`, ces
écrans se replient proprement sur les données existantes.

## Vérifications

```bash
npm run lint && npm test && npm run build     # interface
cd server && npm run lint && npm test         # serveur (PostgreSQL requis)
```

Les tests du serveur couvrent le contrôle d'accès, le parcours de commande, les
courses de concurrence sur le stock et les points, ainsi que la validation des
codes de retrait.

Le poids du premier affichage est plafonné à 250 Ko compressés, vérifié en
intégration continue : la cible est un usage mobile sur réseau lent.

## Variables d'environnement

Voir `.env.example` (interface) et `server/.env.example` (serveur), tous deux
commentés. Les seules valeurs obligatoires au démarrage du serveur sont
`DATABASE_URL`, `JWT_SECRET` et `PICKUP_TOKEN_SECRET` ; la configuration est
validée au lancement et le serveur refuse de démarrer si elle est incomplète.

## Structure

```
src/
  api/            accès au serveur : HTTP, entités, services, temps réel
  components/     interface (ui/ = shadcn, le reste par domaine métier)
  lib/            contexte d'authentification, constantes, formatage
  pages/          écrans, chargés à la demande
  routes.jsx      table des routes et niveau d'accès requis

server/
  entities/       définitions des entités — source de vérité du modèle
  prisma/         schéma généré et migrations
  src/
    access/       registre des politiques d'accès
    auth/         mots de passe, jetons, contrôles de rôle
    domain/       règles métier pures et services transactionnels
    entities/     API générique validée
    integrations/ e-mail, SMS, modèle de langage, stockage
    jobs/         tâches planifiées
    payments/     Orange Money, MTN MoMo, encaissement hors ligne
    routes/       points d'entrée HTTP
```
