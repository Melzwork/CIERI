# Connect this theme to Shopify via GitHub

This folder IS the theme root — the `layout/`, `templates/`, `sections/`,
`assets/`, `config/`, and `locales/` folders must stay at the repository root
(not inside a subfolder). All design fixes are already included.

## 1. Create an empty repo on GitHub
On github.com, create a new repository named e.g. `cieri-theme`.
Do NOT add a README, .gitignore, or license (keep the root clean).

## 2. Push these files
Open a terminal in this folder and run (replace YOUR-USERNAME):

    git init
    git add .
    git commit -m "Initial CIERI theme"
    git branch -M main
    git remote add origin https://github.com/YOUR-USERNAME/cieri-theme.git
    git push -u origin main

## 3. Connect in Shopify
Shopify admin -> Online Store -> Themes -> Add theme -> Connect from GitHub.
Authorize the Shopify GitHub app, pick the `cieri-theme` repo and `main` branch.
Shopify creates a draft theme linked to that branch. Preview, then Publish.

## After connecting
- Edit code locally -> `git push` -> theme updates automatically. No more zips.
- Manage products, collections, page content, and uploaded images in Shopify
  admin as normal — none of that lives in this repo.
- The About hero image is chosen in the theme customizer (About hero section).
- Shopify auto-commits `config/settings_data.json` when you change customizer
  settings. Let Shopify own that file; don't hand-edit it locally.
- Keep this branch connected to one theme only; avoid editing the same file in
  both the Shopify code editor and your local repo at the same time.
