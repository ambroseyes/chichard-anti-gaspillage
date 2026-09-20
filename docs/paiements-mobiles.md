# Paiements mobiles — mise en service

Orange Money et MTN Mobile Money sont câblés sur leurs API publiques et
couverts par des tests de contrat, mais **ils n'ont jamais échangé avec un
environnement d'essai réel**. Ce document dit exactement ce qu'il faut pour
combler cet écart.

## Ce qui est déjà vérifié, sans bac à sable

`server/tests/payments.test.js` simule les réponses des opérateurs et fixe le
contrat :

- le numéro part bien au format international `237XXXXXXXXX` ;
- la devise, la référence de commande et l'URL de rappel sont celles attendues ;
- un refus (400) ne remonte jamais le message de l'opérateur jusqu'au client ;
- une réponse qui n'est pas du JSON ne fait pas tomber la commande ;
- un appel sans réponse est abandonné au bout de dix secondes ;
- une panne passagère (503) est reprise, un refus définitif (400) ne l'est pas ;
- le jeton d'accès est réutilisé tant qu'il est valable, et oublié dès que
  l'opérateur le rejette (401) ;
- aucun chemin ne marque une commande « payée » : seul un rappel signé le peut.

## Ce qui ne peut pas être vérifié sans accès

- Le format exact des réponses réelles, qui peut différer de la documentation.
- Le contenu et la signature des rappels (`webhook`) émis par l'opérateur.
- Les délais réels et le comportement sous charge.
- Les codes d'erreur métier : solde insuffisant, abonné inconnu, plafond atteint.

## Obtenir les accès

### Orange Money

1. Créer un compte sur le portail développeur Orange et demander l'accès à
   l'API *Web Payment* pour le Cameroun.
2. Relever `client_id`, `client_secret` et la clé marchand.
3. L'URL de base du bac à sable est fournie avec les identifiants.

### MTN Mobile Money

1. Créer un compte sur le portail développeur MTN MoMo.
2. S'abonner au produit *Collection* et relever la clé d'abonnement.
3. Créer un utilisateur API et sa clé pour l'environnement `sandbox`
   (procédure `apiuser` / `apikey` du portail).

## Renseigner la configuration

Dans `server/.env` :

```ini
PAYMENT_PROVIDER=orange_money        # ou mtn_momo
PUBLIC_BASE_URL=https://<adresse-joignable-depuis-internet>
PAYMENT_WEBHOOK_SECRET=<secret partagé avec l'opérateur>

ORANGE_MONEY_BASE_URL=
ORANGE_MONEY_CLIENT_ID=
ORANGE_MONEY_CLIENT_SECRET=
ORANGE_MONEY_MERCHANT_ID=

MTN_MOMO_BASE_URL=
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_TARGET_ENVIRONMENT=sandbox
```

`MTN_MOMO_TARGET_ENVIRONMENT` est déclaré séparément et vaut `sandbox` par
défaut. Il ne se déduit **pas** de `NODE_ENV` : une préproduction tournant en
`production` viserait sinon l'environnement réel de l'opérateur.

Une configuration incomplète est refusée avant tout appel réseau, avec le nom
des réglages manquants.

## Le rappel doit être joignable

L'opérateur appelle `POST /api/payments/webhook` depuis Internet.
`PUBLIC_BASE_URL` doit donc pointer vers une adresse publique — un tunnel
suffit en développement.

Le rappel est vérifié par signature HMAC-SHA256 du corps brut, comparée en
temps constant, avec `PAYMENT_WEBHOOK_SECRET`. Sans signature valable, il est
refusé : un rappel forgé ne peut pas marquer une commande payée.

## Dérouler l'essai

1. Lancer la base, le serveur et l'interface.
2. Passer une commande avec un numéro d'essai fourni par l'opérateur, en
   choisissant Orange Money ou MTN.
3. Vérifier qu'une ligne `PaymentIntent` est créée en statut `pending`, avec
   la référence de l'opérateur.
4. Valider le paiement côté opérateur (ou déclencher son rappel d'essai).
5. Vérifier que la commande passe en `payment_status: paid` et `status:
   confirmed`, et que rejouer le même rappel ne produit aucun second effet.

## Points à contrôler en priorité lors de cet essai

- Le format réel du corps du rappel, et le champ qui porte la référence.
- Le nom exact de l'en-tête de signature utilisé par chaque opérateur : le
  code lit aujourd'hui une signature partagée, à confirmer avec eux.
- Le comportement quand l'abonné refuse ou laisse expirer la demande.
- Les montants : les deux opérateurs sont appelés en XAF entier, sans décimale.
