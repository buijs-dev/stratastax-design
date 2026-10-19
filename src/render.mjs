// Renders resolved tokens (see tokens.mjs) for the web. Every file is generated; edit
// stratastax.tokens.yaml instead.
const header = (what) =>
    `/* ${what}\n * Generated from stratastax.tokens.yaml by stratastax-design (scripts/export.mjs); do not edit. */\n`;

const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const px = (value) => (value >= 9999 ? '9999px' : `${value}px`);
const stack = (family, fallback) => (family ? `'${family}', ${fallback}` : fallback);

const fallbacks = {
    sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    heading: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/** The selector of a mode: light is the default, dark follows Starlight (data-theme) and shadcn (.dark). */
const selectors = { light: ':root', dark: ":root[data-theme='dark'], .dark" };

/**
 * tokens.css: every token as a --stx-* custom property, plus the shadcn/ui variables mapped onto them,
 * so shadcn components and Tailwind themes can use the design system directly.
 */
export function renderCss(tokens) {
    const blocks = tokens.modes.map((mode) => {
        const lines = [];
        for (const [name, values] of Object.entries(tokens.colors)) lines.push(`--stx-${kebab(name)}: ${values[mode]};`);
        for (const [name, gradient] of Object.entries(tokens.gradients)) {
            const [from, to] = gradient[mode];
            lines.push(`--stx-gradient-${kebab(name)}: linear-gradient(${gradient.angle}deg, ${from}, ${to});`);
        }
        if (mode === 'light') {
            for (const [name, value] of Object.entries(tokens.radius)) lines.push(`--stx-radius-${name}: ${px(value)};`);
            for (const [name, value] of Object.entries(tokens.space)) lines.push(`--stx-space-${name}: ${px(value)};`);
            for (const name of ['sans', 'heading', 'mono']) lines.push(`--stx-font-${name}: ${stack(tokens.fonts[name], fallbacks[name])};`);
        }
        return `${selectors[mode]} {\n${lines.map((line) => (line ? `  ${line}` : '')).join('\n')}\n}\n`;
    });
    // var() resolves where a property is declared, so the aliases are declared for every mode selector.
    const aliases = `/* shadcn/ui */\n${[...new Set(Object.values(selectors))].join(',\n')} {\n${shadcn().map((line) => `  ${line}`).join('\n')}\n}\n`;
    return `${header('Stratastax design tokens: CSS custom properties and the shadcn/ui variables.')}\n${blocks.join('\n')}\n${aliases}`;
}

// shadcn/ui's names; its "accent" is the hover fill of menus, so it maps to subtle, while the brand
// accent (coral) stays --stx-accent.
function shadcn() {
    const map = {
        background: 'background', foreground: 'on-background',
        card: 'surface', 'card-foreground': 'on-surface',
        popover: 'surface', 'popover-foreground': 'on-surface',
        primary: 'primary', 'primary-foreground': 'on-primary',
        secondary: 'secondary', 'secondary-foreground': 'on-secondary',
        muted: 'subtle', 'muted-foreground': 'muted',
        accent: 'subtle', 'accent-foreground': 'on-background',
        destructive: 'danger', 'destructive-foreground': 'on-danger',
        border: 'border', input: 'border', ring: 'focus',
    };
    return [
        ...Object.entries(map).map(([name, token]) => `--${name}: var(--stx-${token});`),
        '--radius: var(--stx-radius-md);',
    ];
}

/** starlight.css: the Starlight theme (colours, fonts and asides) on top of tokens.css. */
export function renderStarlight(tokens) {
    const ink = (step) => `var(--stx-ink-${step})`;
    // Starlight's grey scale runs from the text colour (white) to the background (black) in both themes.
    const scales = {
        light: { white: '900', 'gray-1': '800', 'gray-2': '700', 'gray-3': '600', 'gray-4': '500', 'gray-5': '300', 'gray-6': '100', 'gray-7': '50' },
        dark: { white: '50', 'gray-1': '100', 'gray-2': '200', 'gray-3': '400', 'gray-4': '500', 'gray-5': '700', 'gray-6': '800', 'gray-7': '900' },
    };
    const neutrals = Object.fromEntries(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((step) => [step, tokens.palette.ink[step]]));

    const scale = (mode) => Object.entries(scales[mode]).map(([name, step]) => `  --sl-color-${name}: ${ink(step)};`).join('\n');
    const asides = { blue: 'primary', purple: 'secondary', green: 'success', orange: 'warning', red: 'danger' };
    const subtle = { primary: 'primary-subtle', secondary: 'secondary-subtle', success: 'secondary-subtle', warning: 'warning-subtle', danger: 'danger-subtle' };

    return `${header('Stratastax theme for Starlight. Load after tokens.css.')}
:root {
${Object.entries(neutrals).map(([step, value]) => `  --stx-ink-${step}: ${value};`).join('\n')}
}

:root,
:root[data-theme='light'],
:root[data-theme='dark'] {
  --sl-color-accent-low: var(--stx-primary-subtle);
  --sl-color-accent: var(--stx-primary);
  --sl-color-accent-high: var(--stx-on-background);
  --sl-color-text: var(--stx-on-background);
  --sl-color-text-accent: var(--stx-primary);
  --sl-color-text-invert: var(--stx-on-primary);
  --sl-color-bg: var(--stx-background);
  --sl-color-bg-nav: var(--stx-surface);
  --sl-color-bg-sidebar: var(--stx-background);
  --sl-color-bg-inline-code: var(--stx-subtle);
  --sl-color-bg-accent: var(--stx-primary);
  --sl-color-hairline: var(--stx-border);
  --sl-color-hairline-light: var(--stx-border);
  --sl-color-hairline-shade: var(--stx-border);
  --sl-color-backdrop-overlay: color-mix(in srgb, var(--stx-on-background) 40%, transparent);
${Object.entries(asides).map(([hue, token]) => `  --sl-color-${hue}-low: var(--stx-${subtle[token]});\n  --sl-color-${hue}: var(--stx-${token});\n  --sl-color-${hue}-high: var(--stx-on-background);`).join('\n')}
  --sl-font: var(--stx-font-sans);
  --sl-font-system: var(--stx-font-sans);
  --sl-font-mono: var(--stx-font-mono);
  --sl-font-system-mono: var(--stx-font-mono);
}

:root,
:root[data-theme='light'] {
${scale('light')}
  --sl-color-black: var(--stx-background);
}

:root[data-theme='dark'] {
${scale('dark')}
  --sl-color-black: var(--stx-background);
}

.site-title,
.sl-markdown-content :is(h1, h2, h3, h4),
h1#_top {
  font-family: var(--stx-font-heading);
  letter-spacing: -0.01em;
}

/* The active page in the sidebar: a primary fill, as in shadcn. */
.sidebar-content a[aria-current='page'] {
  background: var(--stx-primary);
  color: var(--stx-on-primary);
}

.starlight-aside {
  border-radius: var(--stx-radius-md);
  border-inline-start-width: 3px;
}
`;
}

/**
 * swagger.css: Swagger UI in the Stratastax style. Swagger UI has no dark theme, so it always uses
 * the light values, as a light panel in both themes. Every rule is scoped to `html .swagger-ui`, one
 * element more specific than swagger-ui.css, so it wins whatever order a bundler loads the two in.
 */
export function renderSwagger(tokens) {
    return swaggerRules(tokens).replace(/(^|,\s*)\.swagger-ui/gm, '$1html .swagger-ui');
}

function swaggerRules(tokens) {
    const c = (name) => tokens.colors[name].light;
    const fonts = (name) => stack(tokens.fonts[name], fallbacks[name]);
    const methods = {
        get: ['secondaryStrong', 'secondarySubtle'],
        post: ['primary', 'primarySubtle'],
        put: ['highlight', 'highlightSubtle'],
        patch: ['highlight', 'highlightSubtle'],
        delete: ['danger', 'dangerSubtle'],
    };
    const method = (name, [strong, subtle]) => `.swagger-ui .opblock.opblock-${name} {
  border-color: ${c(strong)};
  background: ${c(subtle)};
}

.swagger-ui .opblock.opblock-${name} .opblock-summary {
  border-color: ${c(strong)};
}

.swagger-ui .opblock.opblock-${name} .opblock-summary-method,
.swagger-ui .opblock.opblock-${name} .tab-header .tab-item.active h4 span::after {
  background: ${c(strong)};
}
`;

    return `${header('Stratastax theme for Swagger UI (always light).')}
.swagger-ui,
.swagger-ui .info .title,
.swagger-ui .opblock-tag,
.swagger-ui .opblock .opblock-summary-description,
.swagger-ui .opblock .opblock-summary-path,
.swagger-ui table thead tr td,
.swagger-ui table thead tr th,
.swagger-ui .parameter__name,
.swagger-ui .response-col_status,
.swagger-ui .model-title,
.swagger-ui .model,
.swagger-ui label,
.swagger-ui .tab li {
  color: ${c('onSurface')};
  font-family: ${fonts('sans')};
}

.swagger-ui {
  background: ${c('surface')};
}

.swagger-ui .info .title,
.swagger-ui .opblock-tag {
  font-family: ${fonts('heading')};
}

.swagger-ui .opblock-tag {
  border-bottom-color: ${c('border')};
}

.swagger-ui .info a,
.swagger-ui a.nostyle,
.swagger-ui .info .link {
  color: ${c('primary')};
}

.swagger-ui .markdown p,
.swagger-ui .renderedMarkdown p,
.swagger-ui .parameter__type,
.swagger-ui .prop-format,
.swagger-ui .response-col_description {
  color: ${c('muted')};
}

.swagger-ui code,
.swagger-ui .microlight,
.swagger-ui .opblock .opblock-summary-path {
  font-family: ${fonts('mono')};
}

.swagger-ui .scheme-container {
  background: ${c('surface')};
  border-bottom: 1px solid ${c('border')};
  box-shadow: none;
}

.swagger-ui .opblock {
  border-radius: ${px(tokens.radius.md)};
  box-shadow: none;
}

.swagger-ui .opblock .opblock-summary-method {
  border-radius: ${px(tokens.radius.sm)};
  color: ${c('onPrimary')};
  font-family: ${fonts('sans')};
}

.swagger-ui .opblock .opblock-section-header,
.swagger-ui section.models .model-container,
.swagger-ui .model-box {
  background: ${c('subtle')};
  box-shadow: none;
}

.swagger-ui section.models {
  border-color: ${c('border')};
  border-radius: ${px(tokens.radius.md)};
}

.swagger-ui .btn {
  border-radius: ${px(tokens.radius.md)};
  box-shadow: none;
  font-family: ${fonts('sans')};
}

.swagger-ui .btn.authorize {
  border-color: ${c('primary')};
  color: ${c('primary')};
}

.swagger-ui .btn.authorize svg {
  fill: ${c('primary')};
}

.swagger-ui .btn.execute {
  background: ${c('primary')};
  border-color: ${c('primary')};
  color: ${c('onPrimary')};
}

.swagger-ui input[type='text'],
.swagger-ui input[type='password'],
.swagger-ui input[type='search'],
.swagger-ui textarea,
.swagger-ui select {
  border: 1px solid ${c('border')};
  border-radius: ${px(tokens.radius.md)};
  box-shadow: none;
  font-family: ${fonts('sans')};
}

.swagger-ui :is(input, textarea, select, button):focus-visible {
  outline: 2px solid ${c('focus')};
  outline-offset: 2px;
}

${Object.entries(methods).map(([name, colors]) => method(name, colors)).join('\n')}`;
}

/** tokens.json: the tokens in the Design Tokens Community Group format, the dark values as an extension. */
export function renderDtcg(tokens) {
    const withModes = (type, values) => ({
        $type: type,
        $value: values.light,
        ...(tokens.modes.length > 1 && {
            $extensions: { 'dev.buijs.stratastax': { modes: Object.fromEntries(tokens.modes.filter((m) => m !== 'light').map((m) => [m, values[m]])) } },
        }),
    });
    const dimension = (value) => ({ $type: 'dimension', $value: { value, unit: 'px' } });

    const document = {
        color: Object.fromEntries(Object.entries(tokens.colors).map(([name, values]) => [name, withModes('color', values)])),
        gradient: Object.fromEntries(Object.entries(tokens.gradients).map(([name, gradient]) => [name, {
            $type: 'gradient',
            $value: gradient.light.map((color, i) => ({ color, position: i })),
            $extensions: { 'dev.buijs.stratastax': { angle: gradient.angle, modes: { dark: gradient.dark?.map((color, i) => ({ color, position: i })) } } },
        }])),
        radius: Object.fromEntries(Object.entries(tokens.radius).map(([name, value]) => [name, dimension(value)])),
        space: Object.fromEntries(Object.entries(tokens.space).map(([name, value]) => [name, dimension(value)])),
        breakpoint: Object.fromEntries(Object.entries(tokens.breakpoints).map(([name, value]) => [name, dimension(value)])),
        fontFamily: Object.fromEntries(Object.entries(tokens.fonts).map(([name, family]) => [name, { $type: 'fontFamily', $value: [family, ...fallbacks[name].split(', ')].map((f) => f.replace(/'/g, '')) }])),
        typography: Object.fromEntries(Object.entries(tokens.text).map(([name, style]) => [name, {
            $type: 'typography',
            $value: {
                fontFamily: style.family,
                fontWeight: style.weight,
                fontSize: { value: style.size.base, unit: 'px' },
                lineHeight: style.lineHeight,
                letterSpacing: { value: style.letterSpacing ?? 0, unit: 'px' },
            },
            ...(Object.keys(style.size).length > 1 && {
                $extensions: { 'dev.buijs.stratastax': { responsiveSize: style.size } },
            }),
        }])),
    };
    return `${JSON.stringify(document, null, 2)}\n`;
}
