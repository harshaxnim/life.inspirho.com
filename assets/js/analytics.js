// Draws the public traffic numbers served by the stats Worker (stats-worker/) on /analytics/.
(function () {
	var STATS_URL = "https://stats.inspirho.com/";

	var $ = function (id) { return document.getElementById(id); };
	var fmt = function (n) { return n.toLocaleString("en-US"); };
	var DEVICE = { desktop: "Desktop", mobile: "Mobile", tablet: "Tablet" };
	var regions = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
	var country = function (code) {
		try {
			return (regions && regions.of(code)) || code;
		} catch (e) {
			return code; // not an ISO code ("Unknown", "XX")
		}
	};
	var spaced = function (s) { return s.replace(/([a-z])([A-Z])/g, "$1 $2"); }; // "ChromeMobile" -> "Chrome Mobile"
	var short = function (s) {
		return new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
	};

	function list(el, rows, label) {
		label = label || function (s) { return s; };
		if (!rows.length) {
			el.innerHTML = '<li class="empty">Nobody yet.</li>';
			return;
		}
		var max = rows[0].visits;
		el.replaceChildren.apply(el, rows.map(function (r) {
			var li = document.createElement("li");
			li.style.setProperty("--w", (r.visits / max) * 100 + "%");
			var name = document.createElement("span");
			name.textContent = label(r.name);
			var n = document.createElement("b");
			n.textContent = fmt(r.visits);
			li.append(name, n);
			return li;
		}));
	}

	function daily(rows) {
		// Fill gaps so the chart always shows 30 consecutive days.
		var byDate = {};
		rows.forEach(function (r) { byDate[r.date] = r.visits; });
		var days = [];
		for (var i = 29; i >= 0; i--) {
			var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
			days.push({ date: d, visits: byDate[d] || 0 });
		}
		var max = Math.max.apply(null, [1].concat(days.map(function (d) { return d.visits; })));
		var readout = $("s-readout");
		var chart = $("s-daily");
		chart.replaceChildren.apply(chart, days.map(function (d) {
			var bar = document.createElement("div");
			bar.className = "stats-bar";
			bar.tabIndex = 0;
			bar.style.setProperty("--h", (d.visits / max) * 100 + "%");
			var text = short(d.date) + ": " + fmt(d.visits) + (d.visits === 1 ? " visit" : " visits");
			bar.setAttribute("aria-label", text);
			var show = function () { readout.textContent = text; };
			bar.addEventListener("mouseenter", show);
			bar.addEventListener("focus", show);
			return bar;
		}));
		chart.addEventListener("mouseleave", function () { readout.textContent = ""; });
		$("s-first").textContent = short(days[0].date);
		$("s-last").textContent = short(days[days.length - 1].date);
	}

	// Each country is shaded by the square root of its share of the top country's visits, so a
	// country with a tenth of the readers still shows clearly. Hover (or tap) names it.
	function map(rows) {
		var figure = $("s-map");
		var tip = $("s-map-tip");
		var visits = {};
		rows.forEach(function (r) { visits[r.name] = r.visits; });
		var most = Math.max.apply(null, [1].concat(rows.map(function (r) { return r.visits; })));
		figure.querySelectorAll("path[data-c]").forEach(function (shape) {
			var n = visits[shape.getAttribute("data-c")] || 0;
			shape.classList.toggle("is-read", n > 0);
			shape.style.setProperty("--shade", String(0.2 + 0.8 * Math.sqrt(n / most)));
		});
		figure.querySelector("svg").setAttribute("aria-hidden", "true");
		var hide = function () { tip.hidden = true; };
		figure.onpointermove = figure.onpointerdown = function (e) {
			var shape = e.target.closest && e.target.closest("path[data-c]");
			if (!shape) return hide();
			var code = shape.getAttribute("data-c");
			var n = visits[code] || 0;
			tip.textContent = country(code) + ": " + fmt(n) + (n === 1 ? " visit" : " visits");
			tip.hidden = false;
			var box = figure.getBoundingClientRect();
			var x = e.clientX - box.left;
			tip.style.left = Math.min(Math.max(x, tip.offsetWidth / 2), box.width - tip.offsetWidth / 2) + "px";
			tip.style.top = e.clientY - box.top + "px";
		};
		figure.onpointerleave = hide;
	}

	fetch(STATS_URL)
		.then(function (res) {
			if (!res.ok) throw new Error(res.status);
			return res.json();
		})
		.then(function (s) {
			$("s-day").textContent = fmt(s.day.visits);
			$("s-week").textContent = fmt(s.week.visits);
			$("s-month").textContent = fmt(s.month.visits);
			$("s-views").textContent = fmt(s.month.views);
			daily(s.daily);
			list($("l-refs"), s.referrers);
			map(s.countries);
			list($("l-countries"), s.countries.slice(0, 8), country);
			list($("l-devices"), s.devices, function (d) { return DEVICE[d] || d; });
			list($("l-browsers"), s.browsers, spaced);
			$("s-updated").textContent = "Updated " + new Date(s.updated).toLocaleString() + ".";
			$("stats-status").hidden = true;
		})
		.catch(function () {
			$("stats-status").textContent = "The numbers are taking a breather. Try again in a little while.";
		});
})();
