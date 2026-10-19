// Snapshots of the exported files: a change to the tokens or the renderers shows up as a diff in
// test/snapshots. Run `UPDATE_SNAPSHOTS=1 npm test` to accept it.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { renderCss, renderDtcg, renderStarlight, renderSwagger } from '../src/render.mjs';
import { loadTokens } from '../src/tokens.mjs';

const tokens = loadTokens(join(import.meta.dirname, '..', 'stratastax.tokens.yaml'));
const snapshots = join(import.meta.dirname, 'snapshots');
const update = process.env.UPDATE_SNAPSHOTS === '1';

const files = {
    'tokens.css': renderCss(tokens),
    'starlight.css': renderStarlight(tokens),
    'swagger.css': renderSwagger(tokens),
    'tokens.json': renderDtcg(tokens),
};

describe('export', () => {
    for (const [file, content] of Object.entries(files)) {
        it(`${file} matches its snapshot`, () => {
            const path = join(snapshots, file);
            if (update || !existsSync(path)) {
                mkdirSync(snapshots, { recursive: true });
                writeFileSync(path, content);
            }
            assert.equal(content, readFileSync(path, 'utf8'));
        });
    }

    it('tokens.json is valid JSON with a value for every colour', () => {
        const document = JSON.parse(files['tokens.json']);
        for (const name of Object.keys(tokens.colors)) assert.ok(document.color[name].$value, name);
    });

    it('every --stx-* variable that a theme uses is defined', () => {
        const defined = new Set([...files['tokens.css'].matchAll(/(--stx-[a-z0-9-]+):/g), ...files['starlight.css'].matchAll(/(--stx-[a-z0-9-]+):/g)].map((m) => m[1]));
        for (const [file, content] of Object.entries(files)) {
            for (const [, used] of content.matchAll(/var\((--stx-[a-z0-9-]+)\)/g)) assert.ok(defined.has(used), `${file} uses undefined ${used}`);
        }
    });
});
