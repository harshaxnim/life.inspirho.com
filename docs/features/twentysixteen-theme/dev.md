# Twenty Sixteen look for the Jekyll copy (developer notes)

## Goal
The GitHub Pages copy of the blog (inspirho.com, formerly life.inspirho.com) renders the same HTML and CSS as the WordPress site did, so it looks
the same at every width. Fonts, sizes, widths, buttons, comments and post navigation were measured against the
live site with the same browser and match exactly; the only intended differences are listed under *Known limits*.

## How it is built
- **No Jekyll theme.** The site's own `_layouts/` and `_includes/` print Twenty Sixteen's markup:
  `default.html` (header.php/footer.php), `_includes/content.html` (template-parts/content.php, used by the home
  page and archives), `post.html` (single.php and comments.php), `page.html` (page.php), `archive.html`
  (archive.php), `index.html` (index.php plus `paginate_links()` with mid size 1).
- **Theme files unchanged.** `assets/twentysixteen/` holds Twenty Sixteen 1.3's `style.css`, Genericons and
  `functions.js` (the mobile menu toggle, which needs jQuery; `assets/js/jquery.min.js` is WordPress's copy).
- **WordPress CSS.** `assets/css/wp-block-library.css` and `wp-classic-themes.css` come from WordPress 6.1.1.
  `wp-inline.css` holds the styles WordPress printed inline (global styles, link colour, custom background).
  `wp-custom.css` is the customizer's *Additional CSS*, verbatim. The stylesheets load in WordPress's order.
- **Body classes** (`home blog`, `single`, `page`, `archive`, `no-sidebar`, `custom-background`) are set in
  `default.html`, because the theme's CSS depends on them.
- **Menus** live in `_data/menus.yml`. `_includes/menu-primary.html` adds `current-menu-item` and
  `current-menu-parent` the way WordPress did; the theme shows the current item in bold.
- **Pagination**: `jekyll-paginate` (allowed on GitHub Pages), 5 posts per page at `/page/:num/`, as before.
  Category archives are paginated the same way (`/category/<slug>/page/N/`). `jekyll-paginate` only handles the
  home page, so the migration script writes one small file per category page (front matter `category` and
  `page_num`), and `_layouts/archive.html` takes its slice with `offset`/`limit`. Both use
  `_includes/pagination.html`.
- **Authors**: `_data/authors.yml`. The byline, avatar and bio box (`_includes/author-bio.html`, shown only for an
  author with a bio, inside `.entry-content` as in `content-single.php`) follow the post's `wp_author`.
- **Post data** written by the migration script: `title_html` (titles with markup), `subtitle` (the manual
  excerpt shown under the title), and comments with the HTML WordPress rendered and local avatar files.
- **All page** (`all.html`, `assets/css/site.css`): two views (Years, the default, and Categories) of `site.posts`,
  switched by a small script and kept in the URL hash (`#categories`, `#years`, or a category or year anchor
  such as `#cg` or `#y2016`). Without JavaScript all three views show, one after another.

## Base path
Every internal URL uses `relative_url` in templates, `{{ site.baseurl }}` in post bodies, or a relative path in
CSS. The site therefore works on the custom domain and under a project path. Checked by building with
`--baseurl /inspirho.com` and running html-proofer on both builds; see *Testing*.

## Testing
```sh
docker run --rm -v "$PWD":/site:ro -v lifegems:/usr/local/bundle -v /tmp/out:/out -w /site ruby:3.3 bash -c '
  cp -r /site /tmp/src && cd /tmp/src && bundle install --quiet &&
  bundle exec jekyll build -d /out/root && bundle exec jekyll build --baseurl /inspirho.com -d /out/sub/inspirho.com &&
  gem install html-proofer -v "~>5" --no-document >/dev/null &&
  for b in root sub; do htmlproofer /out/$b --root-dir /out/$b --disable-external --no-enforce-https --ignore-missing-alt; done'
```
The remaining reports are expected. 32 images without `src` and 32 anchors without `href` were in the original
Blogger posts. `#years` is a view name, not element ids.

## Sanity pass (October 30, 2026)
- All 53 URLs in the old site's sitemap resolve, and the 3 that have no page here (author and tag archives) redirect.
- The text, titles, bylines, image count, headers and pagination of 62 pages (all posts, pages, category archives
  and home pages) match the live site. The only difference is that 3 dead Flash videos are now YouTube embeds.
- Built with `jekyll build --safe` (as GitHub Pages builds) at the domain root and under `/inspirho.com`. In both
  builds, html-proofer and an exact-case path check (GitHub's file system is case-sensitive; macOS is not) find
  no broken references. The exceptions are the empty `<img>` and `<a>` tags that were already in the old Blogger
  posts, and the Crayon toolbar icons, which never show and are missing on the old server as well.
- Every page loads in a browser at 1400 px and at 375 px without failed requests, broken images or sideways
  scrolling.

## Known limits
- Comments are read-only. Twenty Sixteen's own "Comments are closed." line replaces the reply form, and
  "Leave a comment" links are not shown.
- The footer credit reads "Proudly hosted on GitHub Pages".
- Emoji in old comments use the system emoji font instead of WordPress's emoji images.
- `url:` in `_config.yml` must match the `CNAME` file (`inspirho.com`). GitHub's metadata plugin cannot derive it until the
  repository exists.
