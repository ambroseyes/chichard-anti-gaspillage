/**
 * Encaissement hors ligne : espèces à la livraison ou au retrait, et mode de
 * développement. L'intention reste `pending` jusqu'à confirmation par le
 * commerçant ou le livreur depuis son espace.
 */
export const manualProvider = {
  name: 'manual',
  async initiate() {
    return { status: 'pending' };
  },
};
