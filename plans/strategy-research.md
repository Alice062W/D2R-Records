# D2RInstitute.gg — Research Findings & Strategic Recommendations

_Research conducted June 2026. Decisions agreed with user before implementation began._

---

## 1. Is It Worth Building?

**Verdict: Yes — with one clear differentiator.**

- D2R has ~50,000 daily active players (mid-2025), stable, not declining.
- Blizzard is **actively investing**: new DLC "Reign of the Warlock" (new class), Ladder Season 13 (Feb 2025), PTR 3.2 (Apr 2025). This is not an abandoned game.
- The D2R player base beats Diablo 3 in active players (confirmed by Blizzard franchise head).
- The trading ecosystem is alive: Traderie and d2jsp are active in 2025.
- **Risk**: Maxroll.gg/d2 and diablo2.io are well-established incumbents. A general D2R info site has no path to visibility.
- **The opportunity**: The "Keep or Dump" socketed item appraiser is a genuine gap — **no existing site has this feature**. This is the only viable entry angle.

**Do not build a general D2R info site. Build the appraiser and own that niche.**

---

## 2. Competitive Landscape

| Competitor | What They Do | Has Socketed Appraiser? |
|---|---|---|
| Maxroll.gg/d2 | Build guides, tier lists, D2Planner, runewords | No |
| diablo2.io | Full item DB, trading marketplace, Larzuk calculator, terror zone tracker | No (Larzuk only) |
| D2Runewizard.com | Runeword calculator, build planner, farming guides | No |
| d2r.world | Item catalog, runeword DB, breakpoint charts, cube recipes (EN + zh-TW) | No |
| Traderie.com | Peer-to-peer trading platform | No |
| DiabloBytes.com | Editorial text socket guides (best base per runeword) | No (text-only, not interactive) |

**The gap is real and uncontested.** The closest anyone gets is:
- DiabloBytes: editorial text lists, no interactivity
- diablo2.io: Larzuk calculator (how many sockets, not whether to keep)

### What D2RInstitute.gg can uniquely own:
1. **Interactive "Keep or Dump" verdict** — input: item type, socket count, eth/non-eth, ilvl → output: runeword viability + keep/dump recommendation + Traderie deep-link
2. **Eth vs. non-eth base tier list** — filterable, ranked by runeword meta (no one has this interactively)
3. **Integrated decision logic** — combining ilvl thresholds, socket count, and class-specific desirability in one place

---

## 3. Language Strategy

**Launch: English + Traditional Chinese (zh-TW) + Simplified Chinese (zh-CN)**

| Language | Market | Rationale |
|---|---|---|
| English | Global | Primary |
| Traditional Chinese (zh-TW) | Taiwan, Hong Kong | d2r.world is Taiwanese — existing community reference; D2R has official zh-TW localization |
| Simplified Chinese (zh-CN) | Mainland China | Blizzard/NetEase partnership; dedicated Chinese D2R edition exists |
| Korean | Later | D2R tech alpha market; add after launch when traffic justifies it |
| Russian | Later | #2 Steam review language |

**Key decisions:**
- Use **`next-intl`** (standard for Next.js App Router i18n — type-safe, Server Component compatible)
- Build `[locale]` route group into the architecture **before writing any UI** — retrofitting is a painful structural refactor
- Item names in zh-TW and zh-CN: available directly in D2R's official game localization files (`pinkufairy/D2R-Excel` TSV files) — use these, not manual translation
- Use d2r.world as a visual terminology reference to verify zh-TW output looks natural (do not scrape their data)
- Language switcher in footer: **EN / 繁中 / 简中**

---

## 4. Monetization Strategy

**Approach: Growth-first, usage-limit freemium. No monetization at MVP.**

The D2R community is small and Reddit-connected. Launching with ads or a paywall before establishing value risks a bad reputation. Running costs are near-zero (`.gg` domain ~$50–80/yr + Netlify free tier).

| Phase | Trigger | Action |
|---|---|---|
| **MVP launch** | Day 1 | Ko-fi tip button in footer only. No ads, no paywall. Pure utility. |
| **Early growth** | 500+ daily users | Add "save items" feature with soft limit (10–20 free). Show upgrade prompt when limit hit. |
| **Monetization** | Consistent traffic | $4.99 one-time unlock (Lemon Squeezy — auto-generates license key, handles VAT) removes limits + hides ads. |
| **Scale** | 20K+ monthly visitors | Amazon affiliate links, gaming gear sponsorships. |

**Never gate the core appraiser itself.** The keep/dump verdict must always be free.

**Do not offer subscriptions.** D2R players (25–40, tech-savvy) will not pay recurring for a utility tool. One-time only.

**Build limit infrastructure from day one:** Track saved items in `localStorage`, set limit constant to `Infinity` at launch. When ready to monetize, change the constant — no retrofit needed.

---

## 5. Open-Source Data Sources

| Data needed | Source | License | Format |
|---|---|---|---|
| Base item list (armor, weapons, shields) | [blizzhackers/d2data](https://github.com/blizzhackers/d2data) | MIT | JSON |
| Runewords (name, runes, sockets, item types, clvl) | [diablo-tools/d2-runewords](https://github.com/diablo-tools/d2-runewords) | MIT | npm package |
| ilvl socket thresholds + eth eligibility + Chinese locale strings | [pinkufairy/D2R-Excel](https://github.com/pinkufairy/D2R-Excel) | — | TSV |

---

## 6. Phase Roadmap

| Phase | Goal | Status |
|---|---|---|
| **Phase 0** | Architecture: Next.js + Tailwind + next-intl (EN/zh-TW/zh-CN), dark mode, Netlify CI/CD, localStorage limit scaffold | 🔲 Not started |
| **Phase 1** | Data prep + Keep/Dump appraiser MVP | 🔲 Not started |
| **Phase 2** | Save feature with soft usage limits (10–20 free) | 🔲 Not started |
| **Phase 3** | Monetization: $4.99 one-time unlock via Lemon Squeezy + light AdSense | 🔲 Not started |
| **Phase 4** | Korean translation + hreflang + Korean SEO | 🔲 Not started |
| **Phase 5** | Scale: affiliate links, sponsorships | 🔲 Not started |

---

## 7. MVP Execution Detail

### Phase 0: Project Bootstrap (~1 day)

```bash
npx create-next-app@latest d2r-institute --typescript --tailwind --app
npm install next-intl
```

- Configure `next-intl` with `[locale]` route group wrapping all pages
- Locales: `en`, `zh-TW`, `zh-CN`
- Dark mode: Tailwind `darkMode: 'class'`, default dark
- Deploy to Netlify immediately — get CI/CD working on day 1

### Phase 1: Data Preparation (~1 day, parallel with Phase 0)

**Output:** Three curated local JSON files in `/data/`:
- `bases.json` — item name (EN/zh-TW/zh-CN), type, max sockets, eth-eligible, ilvl-to-socket thresholds
- `runewords.json` — name, rune order, socket count, required item types, clvl, ladder-only flag
- `thresholds.json` — ilvl breakpoints per item category for max socket determination

### Phase 1: Keep/Dump Logic (`src/lib/appraise.ts`)

Input: `{ itemType, sockets, ethereal, ilvl }`

Algorithm:
1. Determine max sockets the item can roll (thresholds.json + ilvl)
2. Filter runewords: which accept this item type + socket count?
3. Apply eth modifier: eth = BIS for merc runewords (Fort, Treachery, Insight), unsellable for character use
4. Assign tier:
   - **Tier 1 (Keep — High Value):** Matches top-meta runeword (Grief, Enigma, Fort, CoH, etc.)
   - **Tier 2 (Keep — Tradeable):** Matches solid runeword or has trade value
   - **Tier 3 (Situational):** Niche runeword, low demand
   - **Tier 4 (Dump):** No viable runeword match, no trade value

Tier assignments for meta runewords should be **hand-curated** — accuracy over completeness at MVP.

### Phase 1: MVP UI (single appraiser page)

```
[Item Type ▾]  [# Sockets ▾]  [☐ Ethereal]  [Item Level: ___]
                    [ Appraise ]

──── Result ────────────────────────────────────────
  🟢 KEEP — Tier 1
  Eligible runewords: Grief (5s Sword), ...
  [ View on Traderie ↗ ]
```

- All UI text through `next-intl` message keys from day 1
- Traderie deep-link: `https://traderie.com/diablo2resurrected/item/{slug}` — verify slug format manually before shipping
- Footer: Ko-fi button + language switcher (EN / 繁中 / 简中)

### Key Files

| File | Purpose |
|---|---|
| `src/app/[locale]/layout.tsx` | Root layout with next-intl provider |
| `src/app/[locale]/page.tsx` | Appraiser page |
| `src/middleware.ts` | next-intl locale routing |
| `messages/en.json` | English UI strings |
| `messages/zh-TW.json` | Traditional Chinese UI strings |
| `messages/zh-CN.json` | Simplified Chinese UI strings |
| `data/bases.json` | Curated base item data |
| `data/runewords.json` | Runeword data |
| `data/thresholds.json` | ilvl → socket count breakpoints |
| `src/lib/appraise.ts` | Keep/Dump logic (pure function) |

---

## 8. Testing Strategy

**Framework:** Vitest + React Testing Library for unit/component tests. No E2E (Playwright) until post-MVP — overkill for now.

Install once in Phase 0:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

---

### Phase 0 — Architecture
_All manual verification (no logic to unit test yet)_

| Check | How |
|---|---|
| next-intl routing works | Navigate to `/en`, `/zh-TW`, `/zh-CN` — each renders the correct locale string |
| Dark mode default | Page loads in dark mode without user toggle |
| Netlify CI/CD | Push to main → Netlify build passes → live URL resolves |
| localStorage scaffold | Open DevTools → run `localStorage.setItem` / `getItem` — limit constant is accessible |

---

### Phase 1 — Appraiser Logic (`src/lib/appraise.ts`)
_Unit tested. This is the most critical logic in the project._

Test file: `src/lib/appraise.test.ts`

| Test case | Input | Expected output |
|---|---|---|
| Top-tier weapon base | 5-socket Colossus Blade, non-eth, ilvl 50+ | Tier 1 — matches Grief |
| Top-tier armor base | 4-socket Dusk Shroud, non-eth, ilvl 65+ | Tier 1 — matches Enigma |
| Eth merc armor | 4-socket Dusk Shroud, eth | Tier 1 — matches Fortitude (merc) |
| Below ilvl threshold | 6-socket armor, ilvl 20 | Tier 4 — ilvl too low for max sockets to be guaranteed |
| No runeword match | 2-socket Helm with no matching runewords | Tier 4 — Dump |
| Ladder-only runeword | Base that only matches ladder runewords | Tier 2 or 3 with ladder-only flag shown |

Manual check: Traderie deep-link opens correct search page in browser.

---

### Phase 1 — UI (Appraiser Page)
_Manual verification_

| Check | How |
|---|---|
| i18n strings all render | Switch locale via URL — no raw message key strings visible |
| Mobile layout | Test on 375px width (iPhone SE) — no horizontal scroll, inputs usable |
| Result updates correctly | Change inputs → result changes without page reload |
| Traderie link opens | Click "View on Traderie" — opens correct URL in new tab |

---

### Phase 2 — Save Feature
_Unit tested + manual_

| Check | How |
|---|---|
| Save persists across reload | Save an item → refresh page → item still listed |
| Limit enforced | Add items until limit → upgrade prompt appears |
| Limit constant toggle | Change `SAVE_LIMIT` constant to `5` → limit enforces at 5 |

---

### Phase 3 — Monetization
_Manual only (payment flows)_

| Check | How |
|---|---|
| Lemon Squeezy checkout | Complete a test purchase → license key emailed |
| Key activation | Enter key on site → ad-free mode + unlimited saves activated |
| Key persists | Reload page → supporter status retained via localStorage |
