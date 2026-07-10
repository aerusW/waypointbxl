/* ================================================================
   WAYPOINT — js/app.js
   Brussels Protest Tracker: loads data/events.json (manual) and
   data/auto-events.json (refreshed daily by the update workflow),
   expands recurring rules, renders list + calendar views.
   Vanilla JS. No dependencies. No build step.
================================================================ */

(async function () {
  const HORIZON_DAYS = 120; // how far ahead recurring events are expanded

  let data;
  try {
    const res = await fetch("data/events.json", { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    document.getElementById("list-view").innerHTML =
      '<p class="agenda-empty">Could not load data/events.json. If you opened this file directly, serve it over HTTP (e.g. <code>python -m http.server</code>) — browsers block local fetch().</p>';
    return;
  }

  // Auto-generated events (refreshed daily by the scheduled workflow). Optional.
  let autoData = { events: [] };
  try {
    const res = await fetch("data/auto-events.json", { cache: "no-store" });
    if (res.ok) autoData = await res.json();
  } catch (e) { /* file absent — fine */ }

  // ---------- helpers ----------
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  const fmtDay = new Intl.DateTimeFormat("en-BE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  function relLabel(iso) {
    const diff = Math.round((fromISO(iso) - today) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 7) return "This week";
    return "";
  }

  // ---------- expand recurring rules ----------
  function lastWeekdayOfMonth(year, month /*0-based*/, weekday /*1=Mon..7=Sun*/) {
    const d = new Date(year, month + 1, 0); // last day of month
    const wd = ((d.getDay() + 6) % 7) + 1; // Mon=1..Sun=7
    d.setDate(d.getDate() - ((wd - weekday + 7) % 7));
    return d;
  }

  function expandRecurring(rec) {
    const out = [];
    const until = rec.until ? fromISO(rec.until) : null;
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + HORIZON_DAYS);
    const end = until && until < horizon ? until : horizon;

    if (rec.rule.freq === "weekly") {
      // rule.weekday: 1=Mon .. 7=Sun
      const d = new Date(today);
      const wd = ((d.getDay() + 6) % 7) + 1;
      d.setDate(d.getDate() + ((rec.rule.weekday - wd + 7) % 7));
      for (; d <= end; d.setDate(d.getDate() + 7)) {
        out.push({ ...rec, date: toISO(d), recurring: true });
      }
    } else if (rec.rule.freq === "monthly-last-weekday") {
      for (let m = 0; ; m++) {
        const base = new Date(today.getFullYear(), today.getMonth() + m, 1);
        if (base > end) break;
        const d = lastWeekdayOfMonth(base.getFullYear(), base.getMonth(), rec.rule.weekday);
        if (d >= today && d <= end) out.push({ ...rec, date: toISO(d), recurring: true });
      }
    }
    return out;
  }

  // Merge manual + recurring + auto events; manual entries win on (title, date) clashes.
  const manual = [
    ...(data.events || []).filter((e) => e.date >= todayISO),
    ...(data.recurring || []).flatMap(expandRecurring),
  ];
  const seen = new Set(manual.map((e) => e.title.toLowerCase().trim() + "|" + e.date));
  const auto = (autoData.events || []).filter(
    (e) => e.date >= todayISO && !seen.has(e.title.toLowerCase().trim() + "|" + e.date)
  );
  const events = [...manual, ...auto].sort(
    (a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))
  );

  const byDate = new Map();
  for (const ev of events) {
    if (!byDate.has(ev.date)) byDate.set(ev.date, []);
    byDate.get(ev.date).push(ev);
  }

  // ---------- render: event row ----------
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function row(ev) {
    const meta = [
      ev.time ? `<span class="event__time">${esc(ev.time)}</span>` : "",
      ev.location ? `<span>${esc(ev.location)}</span>` : "",
      ev.cause ? `<span>${esc(ev.cause)}</span>` : "",
      ev.organizer && ev.organizer !== "See event page" ? `<span>${esc(ev.organizer)}</span>` : "",
    ].filter(Boolean).join("");

    return `<article class="event">
      <h4 class="event__title">${esc(ev.title)}${ev.recurring ? '<span class="event__tag">recurring</span>' : ""}</h4>
      <p class="event__meta">${meta}</p>
      <p class="event__source">Source: <a href="${esc(ev.source)}" target="_blank" rel="noopener noreferrer">${esc(ev.sourceName || ev.source)}</a></p>
      ${ev.notes ? `<p class="event__notes">${esc(ev.notes)}</p>` : ""}
    </article>`;
  }

  // ---------- list view ----------
  function renderList() {
    const el = document.getElementById("list-view");
    if (events.length === 0) {
      el.innerHTML = '<p class="agenda-empty">No upcoming events listed right now — check back soon.</p>';
      return;
    }
    let html = "";
    for (const [date, evs] of byDate) {
      const rel = relLabel(date);
      html += `<div class="agenda-day">
        <h3 class="agenda-day__date">${fmtDay.format(fromISO(date))}${rel ? `<span class="rel">${rel}</span>` : ""}</h3>
        ${evs.map(row).join("")}
      </div>`;
    }
    el.innerHTML = html;
  }

  // ---------- calendar view ----------
  let calYear = today.getFullYear();
  let calMonth = today.getMonth();
  let selectedDate = null;

  function renderCalendar() {
    const grid = document.getElementById("cal-grid");
    const title = document.getElementById("cal-title");
    title.textContent = new Intl.DateTimeFormat("en-BE", { month: "long", year: "numeric" })
      .format(new Date(calYear, calMonth, 1));

    const dows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let html = dows.map((d) => `<div class="cal-dow">${d}</div>`).join("");

    const first = new Date(calYear, calMonth, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysPrev = new Date(calYear, calMonth, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startOffset + 1;
      let cellDate, out = false;
      if (dayNum < 1) { cellDate = new Date(calYear, calMonth - 1, daysPrev + dayNum); out = true; }
      else if (dayNum > daysInMonth) { cellDate = new Date(calYear, calMonth + 1, dayNum - daysInMonth); out = true; }
      else cellDate = new Date(calYear, calMonth, dayNum);

      const iso = toISO(cellDate);
      const evs = byDate.get(iso) || [];
      const cls = ["cal-cell", out ? "out" : "", iso === todayISO ? "today" : "",
        evs.length ? "has-events" : "", iso === selectedDate ? "selected" : ""].filter(Boolean).join(" ");
      const dots = evs.slice(0, 3).map(() => '<span class="dot"></span>').join("");
      html += `<div class="${cls}" data-date="${iso}"><span class="cal-cell__num">${cellDate.getDate()}</span>${dots ? `<span class="dots">${dots}</span>` : ""}</div>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll(".cal-cell.has-events").forEach((cell) => {
      cell.addEventListener("click", () => {
        selectedDate = cell.dataset.date;
        renderCalendar();
        document.getElementById("cal-day-events").innerHTML =
          `<div class="agenda-day"><h3 class="agenda-day__date">${fmtDay.format(fromISO(selectedDate))}</h3>` +
          (byDate.get(selectedDate) || []).map(row).join("") + "</div>";
      });
    });
  }

  document.getElementById("cal-prev").addEventListener("click", () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar();
  });

  // ---------- view toggle ----------
  const btnList = document.getElementById("btn-list");
  const btnCal = document.getElementById("btn-calendar");
  function setView(v) {
    document.getElementById("list-view").hidden = v !== "list";
    document.getElementById("calendar-view").hidden = v !== "cal";
    btnList.classList.toggle("is-active", v === "list");
    btnCal.classList.toggle("is-active", v === "cal");
    btnList.setAttribute("aria-selected", v === "list");
    btnCal.setAttribute("aria-selected", v === "cal");
  }
  btnList.addEventListener("click", () => setView("list"));
  btnCal.addEventListener("click", () => setView("cal"));

  // ---------- footer stamp ----------
  const stamps = [];
  if (autoData.meta && autoData.meta.generated) stamps.push(`Feed last refreshed ${autoData.meta.generated}`);
  if (data.meta && data.meta.lastUpdated) stamps.push(`curated entries updated ${data.meta.lastUpdated}`);
  if (stamps.length) {
    document.getElementById("last-updated").textContent = stamps.join(" · ") + ".";
  }

  renderList();
  renderCalendar();
})();
