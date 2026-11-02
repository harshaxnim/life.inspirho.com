# inspirho.com

Static (Jekyll) version of the *ins · Π · rho* WordPress blog, built for GitHub Pages.

## Layout

| Path | What |
| --- | --- |
| `_posts/` | The 36 published posts. HTML bodies are WordPress's own rendered output; permalinks match the old URLs exactly (`/cg/dance-for-me/`, …). Approved comments, with their avatars, are kept in front matter. |
| `about/`, `me/`, `all.html` | "le me" (linked from the social menu), the portfolio (menu: *lè me*) and the *All* page (every post by year or by category). |
| `category/` | Category archives at the old `/category/<slug>/` URLs (menu: *cg*, *diy*), 5 posts per page at `/category/<slug>/page/N/` as on WordPress. Each category has two spare page files, so new posts never produce a broken page link; if a category grows past them, copy its last `page-N.html` and raise the numbers. |
| `_layouts/`, `_includes/` | The **Twenty Sixteen** theme's page structure, rebuilt as Jekyll templates that print the same HTML WordPress did. |
| `_data/menus.yml` | The primary menu (header and footer) and the social links. |
| `_data/authors.yml` | The two WordPress authors: *Harsha* (newer posts, with the bio box) and *Harsh* (older posts). A post names its author with `wp_author:`; without it the post is by Harsha. |
| `assets/twentysixteen/` | Twenty Sixteen 1.3's own `style.css`, Genericons icon font and menu scripts, unchanged. |
| `assets/css/wp-*.css` | WordPress's block CSS, the inline styles it printed (link colour, patterned background) and the customizer's *Additional CSS* (Cardo / Noto Serif Display fonts, sliders, canvas glow). `site.css` styles the *All* page. |
| `assets/crayon/` | The Crayon syntax highlighter's CSS, font and script, for the code blocks in old posts. |
| `wp-content/uploads/` | All media, at the same paths as on WordPress, so old image links keep working. |
| `assets/external/` | Images that old posts hot-linked from Blogger, now local. |
| `assets/vendor/three/` | three.js **r186 (0.186.1)**, self-hosted and pinned. |
| `ray/` | The JS ray tracer that used to run on `ray.inspirho.in`. The ray-tracer post and the portfolio now use this copy; it scales down to fit a phone screen. |
| `analytics.html`, `stats-worker/` | The public traffic page at `/analytics/` (not linked from the site) and the Cloudflare Worker that feeds it. See [Analytics](#analytics). |

The home page shows the 5 newest posts in full, with numbered pages at `/page/2/` … (`jekyll-paginate`, as on WordPress).
Old WordPress URLs that have no page here (`/author/admin/`, `/author/harsh/`, `/tag/cg/`, `/categories/`, `/feed/`) redirect to the *All* page or the feed.
Every internal link goes through `relative_url` or `{{ site.baseurl }}`, so the site works both on the custom domain
and under a GitHub project path such as `harshaxnim.github.io/inspirho.com/`.

## Preview locally

```sh
docker run --rm -it -v "$PWD":/site -v lifegems:/usr/local/bundle -w /site -p 4000:4000 \
  ruby:3.3 bash -c 'bundle install && bundle exec jekyll serve --host 0.0.0.0'
# open http://localhost:4000
```

## Publishing

The site is the GitHub repository `harshaxnim/life.inspirho.com`, published with GitHub Pages from `main`.
Every push to `main` rebuilds it in about a minute.

Domains (Cloudflare DNS for `inspirho.com`; the import file is kept outside the repository):

| Name | Records | Cloudflare proxy | Role |
| --- | --- | --- | --- |
| `inspirho.com` | 4 `A` (185.199.108.153, .109.153, .110.153, .111.153) and 4 `AAAA` (2606:50c0:8000::153 … 8003::153) | Off (grey) | The site. `CNAME` and `url:` in `_config.yml` name this domain. |
| `www` | `CNAME` → `harshaxnim.github.io` | Off (grey) | GitHub redirects it to `inspirho.com`. |
| `life` | `CNAME` → `inspirho.com` | On (orange) | A Cloudflare Redirect Rule sends `life.inspirho.com/<path>` to `https://inspirho.com/<path>` (301), so old links keep working. |

GitHub needs the grey-cloud records to issue and renew the HTTPS certificate. To move the site to another domain,
change the `CNAME` file, `url:` in `_config.yml` and the custom domain in the repository's Pages settings together.

## Writing new posts

Add `_posts/YYYY-MM-DD-slug.md` (Markdown works) with front matter:

```yaml
---
layout: post
title: My new post
categories: [cg]
permalink: /cg/my-new-post/   # optional; keeps the old /<category>/<slug>/ style
subtitle: <p>One line shown under the title</p>   # optional
---
```

For three.js posts, copy the import map + `ThreeRender` scaffolding from
`_posts/2022-12-05-with-just-one-polka-dot-nothing-can-be-achieved.html`, and keep the `{{ site.baseurl }}`
prefix on its paths.

New posts appear on the home page, in their category archive and on the *All* page automatically. To add a
menu item, edit `_data/menus.yml`.

## Analytics

Visits are counted with **Cloudflare Web Analytics**: no cookies, no fingerprinting, nothing stored in the reader's
browser. Its beacon is in `_layouts/default.html`, before `</body>`, so every page has it. It is added only when
`JEKYLL_ENV=production`, which the GitHub Pages build sets, so local previews aren't counted. The ray tracer under
`ray/` has no beacon of its own: it only runs inside an iframe on pages that already count the visit.

The numbers are public at **[inspirho.com/analytics/](https://inspirho.com/analytics/)**: visits in the last 24 hours,
7 days and 30 days, page views over 30 days, a 30-day daily chart, a world map shaded by visits per country, and the
top referrers, countries, devices and browsers.

| Part | Where |
| --- | --- |
| Web Analytics site | Cloudflare dashboard → *Analytics & Logs → Web Analytics* → `inspirho.com`. The site tag (`dc3bd1c624cc45549062c8960955dd81`) identifies it in the GraphQL API; the token in the beacon (`8e0590552fff403ab6b59e613913730e`) is public by design. |
| Stats Worker | `stats-worker/worker.js`, deployed as the Worker **`inspirho-stats`** on the custom domain **`stats.inspirho.com`** (it creates its own DNS record). It queries the Web Analytics GraphQL API with an API token kept as a Worker secret, caches the answer at the edge for 10 minutes and returns public JSON with `Access-Control-Allow-Origin: *`. `stats-worker/wrangler.toml` mirrors its configuration. |
| Page | `analytics.html` (served at `/analytics/`), drawn by `assets/js/analytics.js`, styled at the end of `assets/css/site.css`. |
| World map | `_includes/world-map.svg`, inlined into the page: Natural Earth countries in the Equal Earth projection, each path tagged with its ISO code (`data-c`), which is how Cloudflare names countries. Copied from lerpit.com; `scripts/world-map.mjs` regenerates it (see the comment at its top). |

The Worker uses a custom domain rather than `workers.dev` because its edge cache (`caches.default`) only works on a
custom domain. `stats-worker/` and `scripts/` are listed under `exclude:` in `_config.yml`, so they are not published
with the site.

What it can't tell you: readers whose content blockers stop the beacon aren't counted, and Web Analytics doesn't
measure time on page, so the page shows neither. New visits take a few minutes to reach the API, and the Worker's
cache can delay them up to 10 more.

### Redeploying the Worker

There is no global `wrangler`; the Worker is deployed with the Cloudflare REST API. The API token (Account Analytics
Read, Workers Scripts Edit) is read from `~/.cloudflare/api-token` and never typed on the command line:

```sh
cd stats-worker
T=$(cat ~/.cloudflare/api-token)
META=$(python3 -c 'import json,sys;print(json.dumps({"main_module":"worker.js","compatibility_date":"2026-10-01","bindings":[{"type":"plain_text","name":"ACCOUNT_ID","text":"03c4f9649fce0bb609deb92b5d48de54"},{"type":"plain_text","name":"SITE_TAG","text":"dc3bd1c624cc45549062c8960955dd81"},{"type":"secret_text","name":"CF_API_TOKEN","text":open(sys.argv[1]).read().strip()}]}))' ~/.cloudflare/api-token)
curl -s -X PUT -H "Authorization: Bearer $T" \
  https://api.cloudflare.com/client/v4/accounts/03c4f9649fce0bb609deb92b5d48de54/workers/scripts/inspirho-stats \
  -F "metadata=$META;type=application/json" -F "worker.js=@worker.js;type=application/javascript+module"
curl -s https://stats.inspirho.com/   # JSON; may be the cached copy for up to 10 minutes
```

If the shape of the JSON changes, bump the cache key in `worker.js` (`/v2`) so stale copies aren't served.
`npx wrangler deploy` from `stats-worker/` also works (set the secret with `npx wrangler secret put CF_API_TOKEN`).
The custom domain was attached once with `PUT /accounts/<account>/workers/domains`
(`{"hostname":"stats.inspirho.com","service":"inspirho-stats","zone_id":"0f6124069b3454e0013bba9934352608","environment":"production"}`)
and doesn't need redoing on redeploy.
