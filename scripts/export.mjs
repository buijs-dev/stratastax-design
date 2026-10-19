// Exports stratastax.tokens.yaml for the web (npm run export):
//   dist/stratastax.tokens.yaml  the source, for apps that use it as their brand layer
//   dist/tokens.css              --stx-* custom properties and the shadcn/ui variables
//   dist/starlight.css           the Starlight theme (load after tokens.css)
//   dist/swagger.css             the Swagger UI theme
//   dist/tokens.json             Design Tokens Community Group format
//
// usage: node scripts/export.mjs [output-dir]   (default: dist)
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { renderCss, renderDtcg, renderStarlight, renderSwagger } from '../src/render.mjs';
import { loadTokens } from '../src/tokens.mjs';

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'stratastax.tokens.yaml');
const out = resolve(process.argv[2] ?? join(root, 'dist'));

const tokens = loadTokens(source);
mkdirSync(out, { recursive: true });
copyFileSync(source, join(out, 'stratastax.tokens.yaml'));
writeFileSync(join(out, 'tokens.css'), renderCss(tokens));
writeFileSync(join(out, 'starlight.css'), renderStarlight(tokens));
writeFileSync(join(out, 'swagger.css'), renderSwagger(tokens));
writeFileSync(join(out, 'tokens.json'), renderDtcg(tokens));

console.log(`Exported ${Object.keys(tokens.colors).length} colors in ${tokens.modes.join(' and ')} to ${out}`);
