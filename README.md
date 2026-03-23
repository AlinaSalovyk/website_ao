# ITB — Institute of Information Technologies and Business

Website for the Educational and Scientific Institute of Information Technologies and Business at NaUOA.

## 🌐 Multilanguage Support

The site supports two languages:

| Language  | URL prefix | Example           |
| :-------- | :--------- | :---------------- |
| Ukrainian | _(none)_   | `/contacts`       |
| English   | `/en`      | `/en/contacts`    |

Ukrainian is the default locale — pages are served without a prefix. English pages live under `/en/`.

### Architecture

- **Astro built-in i18n** routing (`astro.config.mjs` → `i18n` block).
- **Custom TypeScript translations** — type-safe, zero-dependency.
  - `src/i18n/translations/uk.ts` — Ukrainian strings.
  - `src/i18n/translations/en.ts` — English strings (must satisfy `Translations` type from `uk.ts`).
  - `src/i18n/config.ts` — locale types, slug map, `getLocalizedPath()`, `getAlternatePath()`.
  - `src/i18n/utils.ts` — `getTranslations(locale)` resolver.
  - `src/i18n/LocaleContext.tsx` — React context + `useTranslation()` hook.
- **Language switcher** in header (shadcn/ui DropdownMenu).
- **SEO**: `<html lang>`, hreflang alternates, og:locale, JSON-LD — all locale-aware.

### Adding a New Translation Key

1. Add the key + Ukrainian text to `src/i18n/translations/uk.ts`.
2. Add the English text to `src/i18n/translations/en.ts` (TypeScript will enforce structure parity).
3. Use `t.namespace.key` in your component via `useTranslation()`.

## 🚀 Project Structure

```text
/
├── public/
├── src/
│   ├── components/       # Reusable UI & layout components
│   ├── i18n/             # Internationalization module
│   ├── layouts/          # Astro layouts
│   ├── pages/            # UK pages (default locale)
│   │   └── en/           # EN page mirrors
│   ├── routes/           # Page-level React components
│   └── styles/           # Global CSS
└── package.json
```


## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
