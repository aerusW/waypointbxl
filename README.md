# Waypoint — Brussels Protest Tracker

The Waypoint site, rebuilt as a tracker of upcoming protests and demonstrations in Brussels. Static site — HTML/CSS/JS and two JSON data files. No backend, no build step.

Live at [waypointbxl.be](https://waypointbxl.be/).

## How the data works

Two files under `data/` feed the agenda:

| File | What it is | How it updates |
|---|---|---|
| `data/auto-events.json` | Events from the [Démosphère Bruxelles](https://bxl.demosphere.net/) public feed | **Automatic** — a scheduled GitHub Action (`.github/workflows/update-events.yml`) runs `scripts/update-events.js` daily at 05:17 UTC, commits the result, and Pages redeploys. Never edit this file by hand. |
| `data/events.json` | Curated entries from other sources (YOUCA, city notices, organizer announcements) | **By hand** — edit, commit, push. |

The page merges both at load time, expands recurring rules into dated occurrences, hides past events, and de-duplicates (a curated entry wins over a feed entry with the same title and date).

The feed importer keeps only events whose title matches protest-related keywords (rassemblement, manif, betoging, blocage, …) — the list is at the top of `scripts/update-events.js` if you want to widen or narrow it.

### Adding a one-off event (`events` array in `data/events.json`)

```json
{
  "id": "unique-slug",
  "title": "March for X",
  "date": "2026-10-11",
  "time": "14:00",
  "location": "Gare du Nord, Brussels",
  "organizer": "Some coalition",
  "cause": "Climate",
  "source": "https://example.org/event-page",
  "sourceName": "Organizer website",
  "notes": "Optional free text."
}
```

`id`, `title`, `date`, `location` and `source` matter most; leave the rest `""` if unknown. Dates are `YYYY-MM-DD`, times `HH:MM`. Every entry needs a real `source` URL — nothing goes on the site that can't be verified.

### Adding a recurring event (`recurring` array)

Same fields, but a `rule` instead of a `date` (plus optional `until`):

- Weekly: `"rule": { "freq": "weekly", "weekday": 2 }` — 1=Monday … 7=Sunday
- Last weekday of the month: `"rule": { "freq": "monthly-last-weekday", "weekday": 5 }` (e.g. Critical Mass, last Friday)

Bump `meta.lastUpdated` when you edit, so the page shows fresh dates.

### Where to look for events to curate

[YOUCA Protestagenda](https://www.youca.be/doe-mee/protestagenda) · [City of Brussels agenda](https://www.brussels.be/agenda) · [US Embassy demonstration alerts](https://be.usembassy.gov/category/alert/) · union sites ([FGTB/ABVV](https://www.fgtb.be/), [CSC/ACV](https://www.lacsc.be/)) for national demos.

## Files

```
index.html                          page structure
css/style.css                       design system + agenda styles
js/script.js                        shared page behaviours (nav, reveal, smooth scroll)
js/app.js                           agenda logic (load, merge, list + calendar)
data/events.json                    curated events — edit this one
data/auto-events.json               feed import — auto-generated, don't edit
scripts/update-events.js            feed importer (Node, no dependencies)
.github/workflows/update-events.yml daily update schedule
assets/logo-a.svg                   logo
CNAME                               custom domain (waypointbxl.be)
```

## Local preview

```bash
python -m http.server 8080
# then open http://localhost:8080
```

(Serving over HTTP is needed because the agenda fetches the JSON files.)

## Deploy

Already-configured GitHub Pages repo: just `git push`. Pages redeploys automatically, and the custom domain is handled by the `CNAME` file.

Two things to check once after pushing this version:

1. **Actions tab** — confirm the "Update events from Démosphère" workflow is enabled; run it once manually (Run workflow) to pull the freshest feed. Note GitHub pauses scheduled workflows after 60 days without repo activity — the Actions tab shows a one-click re-enable banner if that happens.
2. **Settings → Pages** — source should be "Deploy from a branch", the default branch, `/ (root)`.

## Disclaimer

Event data is collected from public sources; it may be incomplete, out of date, or wrong. Always verify with the linked source before attending. Demonstrations in Brussels require prior authorization from the [Brussels Capital Ixelles police zone](https://www.brussels.be/demonstrations); a listing here says nothing about whether an event is authorized.
