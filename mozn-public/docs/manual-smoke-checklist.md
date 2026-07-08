# Manual Smoke-Test Checklist — Mozn Frontend

Run before and after each refactor phase. The goal is to confirm **nothing the
user perceives changed**. Automated characterization tests cover pure logic and
some component copy; this checklist covers the things tests can't easily see —
Leaflet rendering, camera/animation, layout, RTL mirroring, and live data.

How to run: `cd frontend && npm run dev` → http://localhost:3000. Check each row
in **both** light/dark themes and **both** English/Arabic, unless noted.

## Global chrome
- [ ] Top bar: logo, search, language toggle, theme toggle all present and aligned.
- [ ] Theme toggle flips light ⇄ dark with the one-shot transition (map excluded from the fade).
- [ ] Language toggle flips EN ⇄ AR: text translates, layout mirrors (RTL), font becomes Cairo, and the choice **persists across a hard reload** (no English flash).
- [ ] Favicon and page title render.

## Map (`/`)
- [ ] Libya is highlighted amber; neighbouring countries are scrimmed (label-free basemap).
- [ ] All station pins render with the correct status colour (normal/warning/offline/severity).
- [ ] Pin labels show station name + hazard word; Arabic mode shows Arabic name + hazard.
- [ ] Zoom in / out / reset controls work; controls sit on the inline-start side (right in RTL).
- [ ] "Stations near me" geolocation flies the camera (allow permission); silent on denial.
- [ ] Label show/hide toggle works.
- [ ] Legend (Normal/Warning/Offline) and the "N stations · Zoom X" pill render and translate.
- [ ] Clicking a pin navigates to that station; Ctrl/⌘/middle-click opens in a new tab.

## Station search
- [ ] Typing filters by English name, Arabic name, and WU id.
- [ ] Keyboard: ↓/↑ move, Enter selects, Esc closes; click-outside closes.
- [ ] Empty query shows the list; no match shows the localized "no match" line; empty stations shows "loading".

## Station side panel (`/stations/:id`)
- [ ] Header: "Station:" label, name (localized), WU id, share + close icons. Close returns to `/`.
- [ ] Tabs (Overview/Charts/Data/Share) render, translate, and highlight the active one.
- [ ] Panel is a right rail on desktop (left in RTL), bottom sheet on mobile.

### Overview — data states
- [ ] **Normal**: temperature card (value, feels-like, H/L, gradient marker), 4 metric cards with descriptions, 7-day forecast.
- [ ] **Warning/alert present**: warning banner renders (title, description, time range, guidance steps, contacts, live pill) with correct severity colour; uses Arabic message/guidance when available.
- [ ] **Offline station**: offline card ("Station unavailable" + last-seen), no metrics.
- [ ] **No reading**: metrics show "—" and "No reading." (localized).
- [ ] **No forecast**: forecast list shows the localized empty line.
- [ ] Wind compass points the right way; description names the direction (localized).

### Charts (`/stations/:id/charts`)
- [ ] Modal opens over the map (backdrop, Esc closes, body scroll locked).
- [ ] Range 24h/7d/30d switch refetches; loading + error states show; 4 charts render.
- [ ] Axis/time labels localize; empty range shows the localized empty line.

### Data (`/stations/:id/data`)
- [ ] Format (CSV active; PDF/PNG disabled "coming soon"), Period, Include checkboxes work.
- [ ] Download produces a CSV with the selected columns; meta line ("N readings · …") localizes.

### Share (`/stations/:id/share`)
- [ ] Public link + embed snippet show the correct URL; Copy → "Copied!" then reverts.
- [ ] Footer station line shows id + Arabic name + last-seen (localized).

## Responsive
- [ ] Mobile (<768), tablet (768–1024), desktop (≥1024): layout, side panel, and controls adapt as before.

## Error/edge
- [ ] Unknown station id → not-found handling.
- [ ] Stations API failure → app still renders (empty map), no crash.
