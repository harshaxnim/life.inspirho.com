// stats.inspirho.com: turns Cloudflare Web Analytics into a small public JSON
// feed for inspirho.com/analytics. The API token stays here as a secret; the
// response is cached at the edge for 10 minutes so page views don't hit the API.
//
// Bindings: ACCOUNT_ID, SITE_TAG (vars) and CF_API_TOKEN (secret, Account Analytics read).

// The RUM dataset silently returns nothing for ranges longer than ~8 days, so the 30 days
// are fetched as five windows of at most 7 days (one aliased group set each) and summed.
const DAYS = 30;
const WINDOW = 7;
const LISTS = {
  refs: ["refererHost", "Direct / unknown", 10],
  countries: ["countryName", "Unknown", 10],
  devices: ["deviceType", "Unknown", 5],
  browsers: ["userAgentBrowser", "Unknown", 6],
};

function buildQuery(windows) {
  const groups = windows.map(({ geq, leq }, i) => {
    const f = `filter: { siteTag: $tag, date_geq: "${geq}", date_leq: "${leq}" }`;
    const lists = Object.entries(LISTS).map(([k, [dim]]) =>
      `w${i}_${k}: rumPageloadEventsAdaptiveGroups(limit: 25, ${f}, orderBy: [sum_visits_DESC]) { sum { visits } dimensions { ${dim} } }`);
    return [`w${i}_daily: rumPageloadEventsAdaptiveGroups(limit: ${WINDOW}, ${f}, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }`, ...lists].join("\n    ");
  });
  return `query ($acc: String!, $tag: String!, $t24: Time!, $t7: Time!) {
  viewer { accounts(filter: { accountTag: $acc }) {
    day: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { siteTag: $tag, datetime_geq: $t24 }) { count sum { visits } }
    week: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { siteTag: $tag, datetime_geq: $t7 }) { count sum { visits } }
    ${groups.join("\n    ")}
  } }
}`;
}

const CACHE_SECONDS = 600;
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
};

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const day = (ms) => iso(ms).slice(0, 10);
const totals = (g) => ({ visits: g[0]?.sum.visits ?? 0, views: g[0]?.count ?? 0 });

// Sum one list across all windows, then keep the top n.
function merge(a, n, k, [dim, blank, limit]) {
  const sums = new Map();
  for (let i = 0; i < n; i++) {
    for (const x of a[`w${i}_${k}`] ?? []) {
      const name = x.dimensions[dim] || blank;
      sums.set(name, (sums.get(name) ?? 0) + x.sum.visits);
    }
  }
  return [...sums].map(([name, visits]) => ({ name, visits })).filter((x) => x.visits > 0)
    .sort((x, y) => y.visits - x.visits).slice(0, limit);
}

async function build(env) {
  const now = Date.now();
  const windows = [];
  for (let end = 0; end < DAYS; end += WINDOW) {
    windows.push({ geq: day(now - Math.min(end + WINDOW - 1, DAYS - 1) * 864e5), leq: day(now - end * 864e5) });
  }
  const variables = { acc: env.ACCOUNT_ID, tag: env.SITE_TAG, t24: iso(now - 864e5), t7: iso(now - 7 * 864e5) };
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: buildQuery(windows), variables }),
  });
  const a = (await r.json())?.data?.viewer?.accounts?.[0];
  if (!a) return null;
  const daily = windows.flatMap((_, i) => a[`w${i}_daily`] ?? [])
    .map((x) => ({ date: x.dimensions.date, visits: x.sum.visits, views: x.count }))
    .sort((x, y) => x.date.localeCompare(y.date));
  const sum = (key) => daily.reduce((n, d) => n + d[key], 0);
  const lists = Object.fromEntries(Object.entries(LISTS).map(([k, spec]) => [k, merge(a, windows.length, k, spec)]));
  return {
    updated: iso(now),
    day: totals(a.day),
    week: totals(a.week),
    month: { visits: sum("visits"), views: sum("views") },
    daily,
    referrers: lists.refs,
    countries: lists.countries,
    devices: lists.devices,
    browsers: lists.browsers,
  };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method !== "GET" || url.pathname !== "/") {
      return new Response('{"error":"not found"}', { status: 404, headers });
    }
    const key = new Request(`${url.origin}/v2`); // bump when the response shape changes
    const hit = await caches.default.match(key);
    if (hit) return hit;

    const body = await build(env).catch(() => null);
    if (!body) {
      return new Response('{"error":"stats unavailable"}', { status: 502, headers: { ...headers, "Cache-Control": "no-store" } });
    }
    const res = new Response(JSON.stringify(body), {
      headers: { ...headers, "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    });
    ctx.waitUntil(caches.default.put(key, res.clone()));
    return res;
  },
};
