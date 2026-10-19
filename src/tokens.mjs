// Loads stratastax.tokens.yaml and resolves it into plain values per mode, with the same rules as the
// style frontend of stratastax-flutter (packages/stx_compiler/lib/src/style/style_frontend.dart):
// a value is #RGB, #RRGGBB, #RRGGBBAA or a {path} reference into primitives (or {color.x} from the
// root); a per-mode map falls back to its light value.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export const colorSlots = [
    'primary', 'onPrimary', 'secondary', 'onSecondary', 'success', 'onSuccess', 'warning', 'onWarning',
    'danger', 'onDanger', 'background', 'onBackground', 'surface', 'onSurface', 'muted', 'border', 'focus',
    'transparent',
];

export class TokenError extends Error {}

export function loadTokens(path) {
    return resolveTokens(parse(readFileSync(path, 'utf8')));
}

export function resolveTokens(root) {
    const modes = root.modes ?? ['light'];
    if (!modes.includes('light')) throw new TokenError('modes: the "light" mode is required');

    const color = root.color ?? {};
    const extend = color.extend ?? {};
    const names = [...colorSlots, ...Object.keys(extend)];

    const colors = {};
    for (const name of names) {
        const value = name in extend ? extend[name] : color[name];
        const path = name in extend ? `color.extend.${name}` : `color.${name}`;
        if (value === undefined) throw new TokenError(`${path}: no value for color "${name}"`);
        colors[name] = Object.fromEntries(modes.map((mode) => [mode, resolveColor(root, perMode(value, mode), path, mode)]));
    }

    const gradients = {};
    for (const [name, spec] of Object.entries(root.gradient ?? {})) {
        const path = `gradient.${name}`;
        gradients[name] = {
            angle: spec.angle ?? 135,
            ...Object.fromEntries(modes.map((mode) => [mode, [
                resolveColor(root, perMode(spec.from, mode), `${path}.from`, mode),
                resolveColor(root, perMode(spec.to, mode), `${path}.to`, mode),
            ]])),
        };
    }

    const primitives = root.primitives ?? {};
    const unit = primitives.unit ?? 4;
    const fonts = primitives.font ?? {};
    const text = Object.fromEntries(Object.entries(root.text ?? {}).map(([name, style]) => [name, {
        ...style,
        family: style.family in fonts ? fonts[style.family] : style.family,
        size: typeof style.size === 'object' ? style.size : { base: style.size },
    }]));

    return {
        modes,
        colors,
        extensions: Object.keys(extend),
        gradients,
        palette: primitives.palette ?? {},
        fonts,
        space: Object.fromEntries(Object.entries(root.space ?? {}).map(([name, value]) => [name, value * unit])),
        radius: { ...root.radius },
        breakpoints: { ...root.breakpoints },
        text,
    };
}

function perMode(value, mode) {
    return value !== null && typeof value === 'object' ? (value[mode] ?? value.light) : value;
}

function resolveColor(root, value, path, mode, seen = new Set()) {
    if (value === undefined || value === null) throw new TokenError(`${path}: no value for mode "${mode}"`);
    const text = String(value).trim();

    const ref = /^\{([^}]+)\}$/.exec(text);
    if (ref) {
        const target = ref[1];
        if (seen.has(target)) throw new TokenError(`${path}: cyclic reference via {${target}}`);
        const resolved = lookup(root, target);
        if (resolved === undefined) throw new TokenError(`${path}: unknown reference {${target}}`);
        return resolveColor(root, perMode(resolved, mode), path, mode, new Set([...seen, target]));
    }

    const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(text);
    if (!hex) throw new TokenError(`${path}: invalid color "${text}" (use #RRGGBB, #RRGGBBAA or {palette.x.y})`);
    let digits = hex[1].toUpperCase();
    if (digits.length === 3) digits = [...digits].map((c) => c + c).join('');
    return `#${digits}`;
}

// palette.blue.700 is looked up in primitives, color.primary from the root.
function lookup(root, path) {
    const segments = path.split('.');
    let node = segments[0] === 'color' ? root : root.primitives;
    for (const segment of segments) {
        if (node === null || typeof node !== 'object' || !(segment in node)) return undefined;
        node = node[segment];
    }
    return node;
}

/** WCAG 2 contrast ratio of two opaque colors (#RRGGBB; an alpha channel is ignored). */
export function contrastRatio(a, b) {
    const luminance = (hex) => {
        const channel = (i) => {
            const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
    };
    const [la, lb] = [luminance(a), luminance(b)];
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
