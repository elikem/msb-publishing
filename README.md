# My Story Booklet

Web personalization for pre-designed devotionals: a reader writes their own story into a defined section of a title, and the result should read as one continuous, professionally designed booklet — not a bolted-on insert.

First title: **Can You Know God Personally** (CYKGP).

## Stack

Rails 8 (Hotwire + Stimulus + esbuild + Tailwind), SQLite, passwordless **magic-link** sign-in. The booklet preview/editor/PDF flow from the former Vite prototype now lives in Rails views and Stimulus.

## Run locally

Requirements: Ruby 3.3+, Node.js 20+, Yarn.

```bash
bundle install
yarn install
bin/rails db:prepare
bin/dev
```

Open [http://localhost:3000](http://localhost:3000). Request a magic link with any email; in development the confirmation page also shows a clickable shortcut, and Letter Opener captures the email.

Production-style asset build:

```bash
yarn build
yarn build:css
bin/rails assets:precompile
```

Tests:

```bash
bin/rails test
```

## What’s in this app

- Magic-link login (email → signed token → session)
- Authenticated CYKGP booklet: page-by-page preview, live story layout (Paged.js), client PDF download
- Title metadata from [`titles/cykgp/meta.json`](titles/cykgp/meta.json) (editable region is data-driven)

## Sources

- Product brief: [docs/brief.md](docs/brief.md)
- Design references: [source/cykgp/](source/cykgp/) (IDML, PDF)
- Fixed-page art: [public/booklets/cykgp/pages/](public/booklets/cykgp/pages/)

## Font substitutes

Adobe Garamond and Requiem are replaced with open-license stand-ins (EB Garamond, Cinzel) from Google Fonts. Confirm embedding rights before production print use.
