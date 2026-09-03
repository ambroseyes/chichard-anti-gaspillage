/** Enveloppe un handler async pour que ses rejets partent vers le middleware d'erreur. */
export const handler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
