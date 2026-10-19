import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { contrastRatio, loadTokens, resolveTokens, TokenError } from '../src/tokens.mjs';

const tokens = loadTokens(join(import.meta.dirname, '..', 'stratastax.tokens.yaml'));

// Every text colour on the backgrounds it is used on. WCAG AA for normal text is 4.5:1.
const pairs = [
    ['onBackground', 'background'],
    ['onSurface', 'surface'],
    ['muted', 'background'],
    ['muted', 'surface'],
    ['muted', 'subtle'],
    ['onBackground', 'subtle'],
    ['onPrimary', 'primary'],
    ['onSecondary', 'secondary'],
    ['onSuccess', 'success'],
    ['onWarning', 'warning'],
    ['onDanger', 'danger'],
    ['onAccent', 'accent'],
    ['onHighlight', 'highlight'],
    // links and teal text on the page
    ['primary', 'background'],
    ['primary', 'surface'],
    ['secondaryStrong', 'background'],
    // the subtle colour fields carry ink text, and the primary on its own field (Starlight's accent-low)
    ...['primarySubtle', 'secondarySubtle', 'accentSubtle', 'highlightSubtle', 'warningSubtle', 'dangerSubtle']
        .map((field) => ['onBackground', field]),
    ['primary', 'primarySubtle'],
];

describe('contrast', () => {
    for (const mode of tokens.modes) {
        for (const [fg, bg] of pairs) {
            it(`${fg} on ${bg} (${mode})`, () => {
                const ratio = contrastRatio(tokens.colors[fg][mode], tokens.colors[bg][mode]);
                assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1 is below 4.5:1`);
            });
        }
    }

    // Swagger UI is always light and puts white method labels on the strong colours.
    for (const method of ['secondaryStrong', 'primary', 'highlight', 'danger']) {
        it(`white on ${method} (Swagger UI method label)`, () => {
            assert.ok(contrastRatio('#FFFFFF', tokens.colors[method].light) >= 4.5);
        });
    }
});

describe('resolution', () => {
    const minimal = (color) => ({
        modes: ['light', 'dark'],
        primitives: { palette: { blue: { 500: '#3B82F6' } } },
        color: {
            ...Object.fromEntries(['primary', 'onPrimary', 'secondary', 'onSecondary', 'success', 'onSuccess', 'warning', 'onWarning',
                'danger', 'onDanger', 'background', 'onBackground', 'surface', 'onSurface', 'muted', 'border', 'focus', 'transparent']
                .map((slot) => [slot, '#000'])),
            ...color,
        },
    });

    it('resolves references, short hex and the light fallback of a mode', () => {
        const resolved = resolveTokens(minimal({ primary: '{palette.blue.500}', focus: { light: '{color.primary}' }, muted: '#abc' }));
        assert.deepEqual(resolved.colors.primary, { light: '#3B82F6', dark: '#3B82F6' });
        assert.deepEqual(resolved.colors.focus, { light: '#3B82F6', dark: '#3B82F6' });
        assert.deepEqual(resolved.colors.muted, { light: '#AABBCC', dark: '#AABBCC' });
    });

    it('rejects an unknown reference', () => {
        assert.throws(() => resolveTokens(minimal({ primary: '{palette.blue.900}' })), TokenError);
    });

    it('rejects a cyclic reference', () => {
        assert.throws(() => resolveTokens(minimal({ primary: '{color.focus}', focus: '{color.primary}' })), /cyclic/);
    });

    it('rejects an invalid colour', () => {
        assert.throws(() => resolveTokens(minimal({ primary: 'blue' })), /invalid color/);
    });

    it('requires every slot', () => {
        const root = minimal({});
        delete root.color.border;
        assert.throws(() => resolveTokens(root), /no value for color "border"/);
    });
});
