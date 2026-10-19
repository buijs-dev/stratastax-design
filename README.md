# Stratastax Design

[![Stratastax](https://img.shields.io/badge/Product-stratastax.dev-4F46E5?style=flat)](https://stratastax.dev/)
[![](https://img.shields.io/badge/Buijs-Software-blue)](https://buijs.dev/)
[![GitHub](https://img.shields.io/github/license/buijs-dev/stratastax-design?color=black)](https://github.com/buijs-dev/stratastax-design/blob/main/LICENSE)

The design system for the Stratastax platform: one token source,
[`stratastax.tokens.yaml`](stratastax.tokens.yaml), for the Flutter apps, the documentation site and Swagger UI.
The design system is shown on [docs.stratastax.dev](https://docs.stratastax.dev/design/design-system/).

## Principles

- **Calm first.** The rest and consistency of [shadcn/ui](https://ui.shadcn.com): neutral surfaces, 1px borders,
  little shadow, compact type. The neutrals (`ink`) have a slight indigo tint, so they feel calm and still our own.
- **A few vivid colours, used on purpose.** Indigo for actions, teal for secondary actions and positive data,
  coral and violet as accents. Subtle colour fields (the `*Subtle` colours) carry callouts, cards and bands.
- **Accessible by construction.** Every text colour passes WCAG AA (4.5:1) on the backgrounds it is used on, in
  light and dark; the tests fail otherwise.
- **Light is the primary mode.** Dark is complete and tested as well.

## Colours

| Role | Light | Dark | Use |
|------|-------|------|-----|
| `primary` (electric indigo) | `#4F46E5`, white text | `#818CF8`, ink text | Buttons, links, the active page |
| `secondary` (fresh teal) | `#14B8A6`, ink text | `#2DD4BF`, ink text | Secondary actions, positive data |
| `secondaryStrong` | `#0F766E` | `#2DD4BF` | Teal as text, or with white text |
| `accent` (soft coral) | `#F97360`, ink text | `#FB8A78`, ink text | Badges and highlights; never an error |
| `highlight` (violet glow) | `#7C3AED`, white text | `#A78BFA`, ink text | Decoration; `focus` uses violet `#8B5CF6` |
| `success` | `#0F766E` | `#2DD4BF` | Success messages, winners |
| `warning` | `#D97706` | `#FCD34D` | Warnings |
| `danger` | `#DC2626` | `#F87171` | Errors and destructive actions |
| `background` / `onBackground` | `#F8F9FF` / `#20243A` | `#11142A` / `#E8EAF7` | The page |
| `surface` / `onSurface` | `#FFFFFF` / `#20243A` | `#171B34` / `#E8EAF7` | Cards, fields, navigation |
| `muted` | `#565C7E` | `#9AA0BC` | Secondary text |
| `subtle` | `#EEF0FB` | `#272B44` | Hover fills, inline code, table headers |
| `border` | `#E0E3F2` | `#272B44` | Borders and dividers |

The brand gradient runs from indigo to violet at 135°.

### Do

- Use `primary` for the one main action on a screen, and `secondary` or `outline` for the others.
- Put text on a vivid fill in its `on*` colour: ink on teal and coral, white on indigo, the strong teal and danger.
- Use the `*Subtle` fields with ink text for callouts and bands.

### Don't

- Use more than one coral accent or one gradient per screen.
- Use coral for errors: an accent must never read as a failure. Errors are `danger`.
- Put white text on `#14B8A6`, `#F97360` or `#8B5CF6` (2.5, 2.7 and 4.2:1); use the strong variants instead.

## Type, radius and spacing

- **Fonts**: Inter for text, Plus Jakarta Sans for headings, JetBrains Mono for code.
- **Radius**: `sm` 6px, `md` 8px (the default for buttons and fields), `lg` 12px for cards, `full` for pills.
- **Spacing**: multiples of a 4px unit (`xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32, `x2l` 48, `x3l` 64).

## Usage

### Flutter (stratastax-flutter)

`stratastax.tokens.yaml` uses the `stx.tokens.yaml` format of the stx compiler and sets every slot, so it is a
complete brand layer: stx_style defaults ← this file ← the app's own `stx.tokens.yaml`, which only adds what is
specific to the app (under `extend`).

### Web

`npm run export` writes the web formats to `dist/`; docs.stratastax.dev publishes them under
`https://docs.stratastax.dev/design/`:

| File | Contents |
|------|----------|
| `tokens.css` | Every token as a `--stx-*` custom property, and the [shadcn/ui](https://ui.shadcn.com/docs/theming) variables (`--background`, `--primary`, …) mapped onto them. Light on `:root`, dark on `[data-theme='dark']` and `.dark` |
| `starlight.css` | The theme for [Starlight](https://starlight.astro.build): colours, fonts, asides; load after `tokens.css` |
| `swagger.css` | The theme for Swagger UI, always light |
| `tokens.json` | The tokens in the [Design Tokens Community Group](https://www.designtokens.org/tr/drafts/format/) format, for tools such as Tokens Studio |
| `stratastax.tokens.yaml` | The source |

In shadcn/ui, `--accent` is the hover fill of menus, so it maps to `subtle`; the brand accent (coral) is
`--stx-accent`.

## Development

```shell
npm ci
npm test          # contrast of every text colour, the resolution rules, snapshots of the export
npm run export    # writes dist/
```

A change to the tokens or the renderers changes the snapshots in `test/snapshots`: review the diff and accept it
with `UPDATE_SNAPSHOTS=1 npm test`. `src/tokens.mjs` resolves the file with the same rules as the style frontend of
the stx compiler (references, modes, colour formats).

[CI](.github/workflows/ci.yml) runs the tests on every push and pull request; after a push to `main` it asks
stratastax-horizon to rebuild the documentation site (secret `DOCS_DISPATCH_TOKEN`, see
[ci-templates](https://github.com/buijs-dev/ci-templates#notify-repository)).

## Related Stratastax projects

- [stratastax-flutter](https://github.com/buijs-dev/stratastax-flutter) - the Flutter framework; its stx compiler reads the tokens
- [stratastax-horizon](https://github.com/buijs-dev/stratastax-horizon) - the documentation site, styled with these tokens
- [ci-templates](https://github.com/buijs-dev/ci-templates) - the shared GitHub Actions
