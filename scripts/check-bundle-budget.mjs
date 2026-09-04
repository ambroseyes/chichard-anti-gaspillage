/**
 * Vérifie le poids du chargement initial.
 *
 * Additionne, compressés, les fichiers que le navigateur télécharge pour
 * afficher la première page : ceux référencés par `dist/index.html`, y compris
 * les préchargements. La cible est un usage mobile sur réseau lent.
 *
 *   node scripts/check-bundle-budget.mjs [budget en Ko]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET_KB = Number(process.argv[2] ?? process.env.BUNDLE_BUDGET_KB ?? 250);
const DIST = 'dist';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`Aucun build trouvé dans ${DIST}/ — lancez d'abord « npm run build ».`);
  process.exit(1);
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const referenced = [...new Set([...html.matchAll(/\/assets\/([^"']+)/g)].map((m) => m[1]))];

let total = 0;
const rows = [];

for (const name of referenced.sort()) {
  const path = join(DIST, 'assets', name);
  if (!existsSync(path)) continue;
  const size = gzipSync(readFileSync(path), { level: 9 }).length;
  total += size;
  rows.push({ name, kb: size / 1024 });
}

if (!rows.length) {
  console.error("index.html ne référence aucun fichier de dist/assets — build incomplet ?");
  process.exit(1);
}

const totalKb = total / 1024;
for (const row of rows) console.log(`  ${row.name.padEnd(44)} ${row.kb.toFixed(1).padStart(7)} Ko`);
console.log(`  ${'—'.repeat(44)} ${'—'.repeat(7)}`);
console.log(`  ${'chargement initial'.padEnd(44)} ${totalKb.toFixed(1).padStart(7)} Ko  (budget ${BUDGET_KB} Ko)`);

const totalBuild = readdirSync(join(DIST, 'assets'))
  .filter((f) => f.endsWith('.js'))
  .length;
console.log(`\n  ${totalBuild} fichiers JS au total : le reste est chargé à la demande.`);

if (totalKb > BUDGET_KB) {
  console.error(
    `\n::error::Le chargement initial pèse ${totalKb.toFixed(1)} Ko compressés, au-dessus du budget de ${BUDGET_KB} Ko.`,
  );
  process.exit(1);
}
