import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * Les identifiants doivent exister avant que les modules ne lisent `env`.
 * Sans bac à sable, ces tests vérifient le contrat : ce que l'on envoie à
 * l'opérateur, et ce que l'on fait de chaque réponse possible.
 */
process.env.ORANGE_MONEY_BASE_URL = 'https://om.test';
process.env.ORANGE_MONEY_CLIENT_ID = 'client';
process.env.ORANGE_MONEY_CLIENT_SECRET = 'secret';
process.env.ORANGE_MONEY_MERCHANT_ID = 'marchand';
process.env.MTN_MOMO_BASE_URL = 'https://momo.test';
process.env.MTN_MOMO_SUBSCRIPTION_KEY = 'abonnement';
process.env.MTN_MOMO_API_USER = 'utilisateur';
process.env.MTN_MOMO_API_KEY = 'clé';
process.env.MTN_MOMO_TARGET_ENVIRONMENT = 'sandbox';

const { requestWithRetry, PaymentHttpError } = await import('../src/payments/http.js');

/*
 * Chaque test repart d'un module neuf : les fournisseurs gardent leur jeton en
 * mémoire, et une mise en cache héritée du test précédent fausserait le
 * décompte des appels réseau.
 */
let orangeMoneyProvider;
let mtnMomoProvider;

async function rechargerFournisseurs() {
  vi.resetModules();
  ({ orangeMoneyProvider } = await import('../src/payments/orange-money.js'));
  ({ mtnMomoProvider } = await import('../src/payments/mtn-momo.js'));
}

const réponse = (status, body, { texte = false } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => (texte ? JSON.parse(body) : body),
  text: async () => (texte ? body : JSON.stringify(body)),
});

const commande = {
  reference: 'PAY-abc',
  amount: 3350,
  phone: '699112233',
  description: 'Chichard order 42',
};

let fetchSimulé;

beforeEach(async () => {
  fetchSimulé = vi.fn();
  vi.stubGlobal('fetch', fetchSimulé);
  await rechargerFournisseurs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Orange Money', () => {
  it('envoie le numéro au format international attendu', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'jeton', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(200, { pay_token: 'OM-1' }));

    const résultat = await orangeMoneyProvider.initiate(commande);

    const [, options] = fetchSimulé.mock.calls[1];
    const corps = JSON.parse(options.body);

    // Régression : « 699112233 » partait tel quel et l'opérateur refusait.
    expect(corps.subscriber_msisdn).toBe('237699112233');
    expect(corps.currency).toBe('XAF');
    expect(corps.order_id).toBe('PAY-abc');
    expect(résultat).toEqual({ status: 'pending', providerRef: 'OM-1' });
  });

  it("n'ouvre jamais une transaction déjà payée", async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'jeton', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(200, { pay_token: 'OM-2' }));

    const résultat = await orangeMoneyProvider.initiate(commande);
    // Seul un rappel signé de l'opérateur peut valider un paiement.
    expect(résultat.status).toBe('pending');
  });

  it('refuse un numéro que l’opérateur ne saurait pas joindre', async () => {
    await expect(orangeMoneyProvider.initiate({ ...commande, phone: '12345' })).rejects.toThrow(
      /invalide/i,
    );
    // Aucun appel réseau : le refus est immédiat.
    expect(fetchSimulé).not.toHaveBeenCalled();
  });

  it('ne renvoie pas le message de l’opérateur au client', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'jeton', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(400, { message: 'INSUFFICIENT_FUNDS on wallet 237699112233' }));

    await expect(orangeMoneyProvider.initiate(commande)).rejects.toThrow(
      'Orange Money : refus (400)',
    );
  });

  it('survit à une réponse qui n’est pas du JSON', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'jeton', expires_in: 3600 }))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Unexpected token < in JSON');
        },
      });

    // Une passerelle qui renvoie du HTML ne doit pas faire tomber la commande
    // avec une erreur d'analyse incompréhensible.
    const résultat = await orangeMoneyProvider.initiate(commande);
    expect(résultat).toEqual({ status: 'pending', providerRef: null });
  });

  it('ne redemande pas un jeton encore valable', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'jeton', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(200, { pay_token: 'OM-1' }))
      .mockResolvedValueOnce(réponse(200, { pay_token: 'OM-2' }));

    await orangeMoneyProvider.initiate(commande);
    await orangeMoneyProvider.initiate({ ...commande, reference: 'PAY-def' });

    // Un jeton, deux paiements : trois appels au total et non quatre.
    expect(fetchSimulé).toHaveBeenCalledTimes(3);
  });

  it('oublie un jeton que l’opérateur vient de rejeter', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'périmé', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(401, {}))
      .mockResolvedValueOnce(réponse(200, { access_token: 'frais', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(200, { pay_token: 'OM-3' }));

    await expect(orangeMoneyProvider.initiate(commande)).rejects.toThrow(/401/);

    // La tentative suivante doit redemander un jeton plutôt que rejouer
    // celui que l'opérateur vient de refuser.
    const résultat = await orangeMoneyProvider.initiate(commande);
    expect(résultat.providerRef).toBe('OM-3');
    expect(fetchSimulé).toHaveBeenCalledTimes(4);
  });
});

describe('MTN MoMo', () => {
  it('envoie un MSISDN et vise l’environnement déclaré', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(200, { access_token: 'jeton', expires_in: 3600 }))
      .mockResolvedValueOnce(réponse(202, {}));

    const résultat = await mtnMomoProvider.initiate(commande);
    const [, options] = fetchSimulé.mock.calls[1];
    const corps = JSON.parse(options.body);

    expect(corps.payer).toEqual({ partyIdType: 'MSISDN', partyId: '237699112233' });
    // Régression : l'environnement se déduisait de NODE_ENV, donc une
    // préproduction visait l'environnement réel de l'opérateur.
    expect(options.headers['X-Target-Environment']).toBe('sandbox');
    expect(options.headers['X-Reference-Id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(résultat.status).toBe('pending');
    expect(résultat.providerRef).toBe(options.headers['X-Reference-Id']);
  });

  it('refuse un numéro injoignable sans appeler l’opérateur', async () => {
    await expect(mtnMomoProvider.initiate({ ...commande, phone: '00' })).rejects.toThrow(
      /invalide/i,
    );
    expect(fetchSimulé).not.toHaveBeenCalled();
  });
});

describe('appels bornés', () => {
  it('abandonne après le délai au lieu d’attendre indéfiniment', async () => {
    const expiration = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    fetchSimulé.mockRejectedValue(expiration);

    await expect(
      requestWithRetry('https://lent.test', {}, { timeoutMs: 50, retries: 0, label: 'Essai' }),
    ).rejects.toThrow(/pas de réponse en 50 ms/);
  });

  it('reprend une panne passagère, puis réussit', async () => {
    fetchSimulé
      .mockResolvedValueOnce(réponse(503, {}))
      .mockResolvedValueOnce(réponse(200, { ok: true }));

    const response = await requestWithRetry('https://instable.test', {}, { retries: 1 });
    expect(response.status).toBe(200);
    expect(fetchSimulé).toHaveBeenCalledTimes(2);
  });

  it('ne reprend pas un refus définitif', async () => {
    fetchSimulé.mockResolvedValue(réponse(400, {}));

    const response = await requestWithRetry('https://refus.test', {}, { retries: 2 });
    expect(response.status).toBe(400);
    // Retenter un 400 ne fait que retarder le refus.
    expect(fetchSimulé).toHaveBeenCalledTimes(1);
  });

  it('expose une erreur typée, pas une erreur générique', async () => {
    fetchSimulé.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(
      requestWithRetry('https://mort.test', {}, { retries: 0 }),
    ).rejects.toBeInstanceOf(PaymentHttpError);
  });
});
