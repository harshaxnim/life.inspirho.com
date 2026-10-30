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
