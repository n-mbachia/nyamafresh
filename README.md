# Nyama Fresh

Nyama Fresh is a mobile-first static storefront for ordering halal beef and goat in Kikuyu. Customers choose meat, provide delivery details, review a price estimate, and send the order to the business through WhatsApp.

The site is deployed as static assets to Cloudflare using Wrangler. There is no application server or order database in this project.

## Requirements

- Node.js 22 or later
- npm
- A Cloudflare account with Wrangler authentication for deployment

## Get started

From the project root:

```sh
npm ci
npm run dev
```

The `dev` script rebuilds the CSS and starts Wrangler's local development server. Open the local URL printed by Wrangler (normally `http://localhost:8787`).

## Commands

| Command | Description |
| --- | --- |
| `npm test` | Check `public/app.js` for JavaScript syntax errors. This is not a browser or end-to-end test. |
| `npm run build:css` | Compile and minify Tailwind CSS from `public/input.css` into `public/styles.css`. |
| `npm run watch:css` | Rebuild CSS as source files change. |
| `npm run dev` | Build CSS, then run the site locally with Wrangler. |
| `npm run deploy -- --dry-run` | Build CSS and validate the Wrangler deployment without publishing. |
| `npm run deploy` | Build CSS and deploy the contents of `public/` to Cloudflare. |

Run commands from the project root. Wrangler reads deployment settings from `wrangler.toml`.

## Project layout

```text
.
├── package.json
├── package-lock.json
├── wrangler.toml
└── public/
    ├── index.html       # Page markup and page metadata
    ├── app.js           # Order UI, pricing display, validation, WhatsApp handoff
    ├── config.js        # Contact details, prices, packs, delivery zones and schedule
    ├── input.css        # Tailwind import, theme tokens and custom component styles
    ├── styles.css       # Generated CSS; do not edit directly
    └── ...              # Images, icons and web manifest served as static assets
```

`public/` is both the website document root and the Cloudflare assets directory. Keep public image and icon references relative to this root (for example, `beefinbone.webp`), and keep those files in `public/`.

## Updating the site

- **Prices, products, order limits, delivery areas, days, and contact details:** edit `public/config.js`.
- **Page copy, image placement, metadata, or accessible labels:** edit `public/index.html`.
- **Order behavior:** edit `public/app.js`. Pricing shown to customers is calculated in the browser; if an order endpoint is added, validate all submitted prices and data on the server.
- **Theme, reusable styles, or Tailwind utilities:** edit `public/input.css`, then run `npm run build:css`. `public/styles.css` is generated and overwritten by the build.
- **Photos, logo, icons, and link-preview image:** add or replace files in `public/` and update their references in `index.html` or `site.webmanifest`.

### Order flow and configuration

The current checkout opens a prefilled WhatsApp message to `WHATSAPP_NUMBER` in `public/config.js`. Customers still need to send that message to place their order. `ORDER_ENDPOINT` is empty by default, so orders are not saved to a server. Configure it only when a compatible endpoint has been implemented and deployed. `POCHI_NUMBER` is optional; when blank, the checkout tells customers that payment details will be shared on WhatsApp.

## Deployment

Authenticate Wrangler once if needed:

```sh
npx wrangler login
```

Validate the build and deployment configuration without publishing:

```sh
npm run deploy -- --dry-run
```

Deploy to the Cloudflare account selected in Wrangler:

```sh
npm run deploy
```

The deploy command rebuilds `public/styles.css` and publishes `public/` according to `wrangler.toml`. Confirm that the target Cloudflare account and project are correct before deploying.

## Before opening a pull request

1. Run `npm test` and `npm run build:css`.
2. Run `npm run deploy -- --dry-run` to check Wrangler configuration and assets.
3. Use `npm run dev` to review the page at narrow phone widths and desktop widths.
4. Check that the logo, halal badge, meat photo, cut diagram, favicon, and manifest icons load.
5. Exercise the pack, family-box, and goat order paths through to the WhatsApp draft. Do not send a live order while testing.
6. Describe user-visible changes and any configuration or deployment requirements in the pull request.

The repository does not currently have automated browser tests. `npm test` checks JavaScript syntax only.
