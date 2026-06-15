# CIERI Shopify Theme

This is your custom storefront converted into a valid Shopify theme. Upload the
ZIP and your design renders inside Shopify, with product and collection pages
wired to pull real data.

## How to upload

1. In Shopify admin go to **Online Store → Themes**.
2. Click **Add theme → Upload zip file** (sometimes under "Import theme").
3. Select `cieri-theme.zip`. It appears under **Draft themes**.
4. Click **Customize** to preview, or **Actions → Preview**.
5. When you're happy, **Actions → Publish** to make it live.

## Set up the content Shopify needs

The theme is the shell — these pull in the actual data:

- **Products**: Admin → Products → add your items (title, price, images, variants).
  The product page reads `{{ product.title }}`, price, options, and images
  automatically. The variant selector adapts to whatever options you create
  (size only, or size + colour).
- **Collections**: Admin → Products → Collections. Create collections with these
  handles so the nav links resolve: `new`, `best-sellers`, `tops`, `bottoms`,
  `dresses`, and `all` (Shopify usually provides `all` automatically). The
  collection page reads `{{ collection.title }}` and loops its products.
- **Pages**: Admin → Online Store → Pages.
  - Create a page with handle `about` → it uses the About template.
  - Create a page with handle `customer-care` → it uses the Customer Care template.
- **Policies**: Admin → Settings → Policies. Paste your Privacy and Terms text
  here (and Refund + Shipping). Shopify generates `/policies/...` pages
  automatically, so you don't need separate HTML for these.

## What works out of the box

- Your full design: header, footer, fonts, CSS, announcement bar, mobile menu.
- Homepage, Customer Care, and the product/collection layouts.
- Product page: title, price, image gallery, adaptive variant picker, Add to bag.
- Collection page: dynamic title + real product grid with pagination.
- Native Shopify cart page, search, 404, account pages, and checkout.

## What still needs your hands

- **About page is a hero stub.** The original page had only a background image and
  no "Our Story" text. Add your copy by editing the `about` page in admin or the
  `sections/main-page-about.liquid` section.
- **The slide-out cart drawer is prototype-only.** Its JS (in `assets/theme.js`)
  was built for the static demo and shows a hardcoded "(2)" count. To make it
  reflect the real cart, rewire those handlers to Shopify's AJAX Cart API
  (`/cart/add.js`, `/cart.js`, `/cart/change.js`). Until then, customers can still
  add to cart and use the native `/cart` page and checkout — only the drawer
  preview is cosmetic.
- **Search drawer** likewise is a front-end shell; the working search lives at the
  native `/search` page.
- **Product/collection markup is a clean starting point**, not a pixel match to the
  prototype's static cards. Adjust the styling in `sections/main-product.liquid`
  and `sections/main-collection.liquid` to taste once real products are in.
- **Test on a draft theme first**, never edit live.

## Structure

- `layout/theme.liquid` — shared shell (head, header, drawers, footer)
- `sections/` — the content for each page type
- `templates/` — which section each page uses
- `assets/theme.css`, `assets/theme.js` — your styles and scripts
- `config/`, `locales/` — required Shopify config

A note: Shopify's admin labels and theme APIs change over time, so if a menu name
above differs slightly, check the current guide at https://shopify.dev/docs/themes.
This theme was built to the Online Store 2.0 structure.
