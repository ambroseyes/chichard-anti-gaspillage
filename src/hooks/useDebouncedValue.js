import { useEffect, useState } from 'react';

/**
 * Renvoie la valeur après un temps de calme.
 *
 * La barre de recherche interroge le serveur à chaque frappe ; sans ce délai,
 * taper « tomates » déclenche sept requêtes dont six sont périmées avant
 * d'arriver.
 */
export function useDebouncedValue(value, delay = 250) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
