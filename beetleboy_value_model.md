# BeetleBoy / BeetleCraft — Mathematical Value Model
_Last updated: 2026-04-07 (v10.3 — live hammer break%, strategy toggle, flower transmutation)_

## Methodology

**Base cost unit**: 1 farmable item from a catch (Green Beetle, Ladybug, Purple Beetle, any junk item, any Tin flower). Each catch yields 1 beetle + 1 junk + XP.

**RNG tax**: Smash recipes are probabilistic. Standard smash = 1.5x multiplier, endgame smash = 2.0x multiplier to account for expected failures.

**Coupon collector tax**: Bridge recipes that produce 1-of-N random outputs (Nectar OR Cattail, Pinecone OR Moss OR Gunpowder) require additional attempts to get a specific output.

---

## Complete Item Value Table

### Tier 0 — Farmable (Depth 0, Cost 1)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Green Beetle | 1 | 1 | farmable | Sacrifice fodder, transmutation input |
| Ladybug | 1 | 2 | farmable | Bronze beetle, used in Pond/Monarch |
| Purple Beetle | 1 | 2 | farmable | Bronze beetle, used in Monarch/Hercules |
| Junk Items (x27 types) | 1 | 1 | farmable | Junk Cube input |
| Cheese | 1 | 1 | farmable | Currency for hunts |
| Daisy | 1 | 2 | farmable | Tin flower |
| Poppy | 1 | 2 | farmable | Tin flower |
| Sunflower | 1 | 2 | farmable | Tin flower |

### Tier 1 — First Crafts (Depth 1-2, Cost 2-5)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Junk Cube | 2 | 3 | junk | 2 junk. Versatile: hammers, transmutation, keys |
| Tin Pollen | 3 | 5 | pollen | 2 Tin flowers x1.5 RNG. Bronze Hammer input |
| BeetleBoy Key | 5 | 4 | utility | Bronze flower + Junk Cube. One-time need |

### Tier 1.5 — Bronze Flowers (Depth 2, Cost ~4.5)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Marigold | 4.5 | 7 | craftable | Transmute: Green + Purple + Junk Cube |
| Gallic Rose | 4.5 | 7 | craftable | Same transmutation pattern |
| Milk Thistle | 4.5 | 7 | craftable | Same transmutation pattern |

### Tier 2 — Compression & Bronze Pollen (Depth 2-3, Cost 6-14)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Junk Tesseract | 6 | 8 | junk | 3 Junk Cubes. Every hammer upgrade needs one |
| Bronze Pollen | 13.5 | 12 | pollen | 2 Bronze flowers x1.5 RNG. Gateway to artifacts |
| Tin Hammer | 4 | 6 | utility | 2 Junk Cubes. +0% bonus, 10% break |

### Tier 3 — Bronze Bridge Artifacts (Depth 4, Cost ~22)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Nectar | 22 | 18 | bridge | Bronze beetle + Bronze Pollen. Makes Monarch |
| Cattail | 22 | 18 | bridge | Same recipe, RNG output. Makes Pond Beetle |
| Bronze Hammer | 13 | 15 | utility | Tin Hammer + Tesseract + Tin Pollen. +5%, 5% break |

### Tier 4 — Mithril Beetles (Depth 5, Cost ~35)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Pond Beetle | 35 | 25 | collectible | Cattail + Ladybug. PRIMARY BOTTLENECK ITEM |
| Monarch | 35 | 25 | collectible | Nectar + Ladybug/Purple |

### Tier 4 — Mithril Flowers (Depth 2-3, Cost ~40)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Royal Poinciana | 40 | 30 | craftable | Transmute or catch. Makes Giraffe Weevil |
| Camellia | 40 | 30 | craftable | Makes Pillbug |
| Morning Glory | 40 | 30 | craftable | Makes Imperial Tortoise |

### Tier 5 — Mithril Pollen & Hammer (Depth 4-6, Cost 33-120)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Mithril Pollen | 120 | 40 | pollen | 2 Mithril flowers. Opens artifact pipeline |
| Mithril Hammer | 33 | 30 | utility | +20% bonus, 10% break |

### Tier 5 — Rare Beetles (Depth 6, Cost ~113)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Giraffe Weevil | 113 | 55 | collectible | Royal Poinciana + Mithril beetle |
| Pillbug | 113 | 55 | collectible | Camellia + Mithril beetle |
| Imperial Tortoise Beetle | 113 | 55 | collectible | Morning Glory + Mithril beetle |

### Tier 6 — Mithril Artifacts (Depth 6-8, Cost ~234)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Pinecone | 234 | 50 | bridge | Mithril beetle + Mithril Pollen. 1-of-3 RNG |
| Moss | 234 | 50 | bridge | Same recipe, RNG output |
| Gunpowder | 234 | 50 | bridge | Same recipe, RNG output |

### Tier 7 — Adamantine Beetles (Depth 7-9, Cost ~404)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Goliath Beetle | 404 | 60 | collectible/craft | Pinecone + Mithril beetle |
| Stag Beetle | 404 | 60 | collectible/craft | Moss + Mithril beetle |
| Bombardier Beetle | 404 | 55 | collectible/craft | Gunpowder + Mithril beetle |

### Tier 7 — Adamantine Flowers & Hammer (Depth 3-8, Cost 159-410)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Pincushion | 410 | 65 | craftable | Transmute from Adamantine beetle or tier-up |
| Gazania | 410 | 65 | craftable | Same routes as Pincushion |
| Adamantine Hammer | 159 | 65 | utility | +35% bonus, 2% break. Best value hammer |

### Tier 8 — Adamantine Pollen (Depth 4-9, Cost ~1230)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Adamantine Pollen | 1230 | 75 | pollen | 2 Adamantine flowers. Diamond Hammer + Hercules |

### Tier 8 — Epic Beetles (Depth 8-10, Cost ~1220)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Sabertooth Longhorn | 1220 | 78 | collectible/craft | Pincushion + Adamantine beetle. Mars Rhino input |
| Sunset Moth | 1220 | 78 | collectible/craft | Gazania + Adamantine beetle. Mars Rhino input |

### Tier 9 — Black Lotus & Diamond Hammer (Depth 8-10, Cost 1395-1404)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Black Lotus | 1404 | 88 | craftable | Gunpowder + Moss + Pinecone. Needs all 3 artifacts |
| Diamond Hammer | 1395 | 82 | utility | +90% bonus, 1% break (9% after first use) |

### Tier 10 — Legendary/Endgame (Depth 10+, Cost 2500-7700)

| Item | Base Cost | Score | Category | Notes |
|------|-----------|-------|----------|-------|
| Hercules Beetle | 2500+ | 100 | collectible | Golden Scarab + Adamantine Pollen + Purple |
| Mars Rhino Beetle | 7688 | 95 | collectible | Black Lotus + Sunset Moth + Sabertooth |
| Golden Scarab | ??? | 90 | collectible/craft | No known recipe. Rare catch? |

---

## Bottleneck Analysis

### Top 5 Bottleneck Items

1. **Mithril Beetles (Pond/Monarch)** — Every Adamantine beetle, Rare beetle, artifact bridge, Mithril flower transmutation, and Mithril pollen consumes one. Need 15-20 for full collection. Each costs ~35 base units.

2. **Mithril Pollen** — Gateway to artifacts. Each costs ~120 base units (2 Mithril flowers). Need 4-6 batches minimum.

3. **Junk Tesseract** — 4 needed for hammer chain alone. 24+ junk items locked up.

4. **Bronze Pollen** — Gateway to Nectar/Cattail. Without it, no Mithril beetles, no further progression.

5. **Adamantine Beetles** — Required for Epic beetles AND Adamantine flower transmutation. Each ~404 base units. Need 4-6 minimum.

---

## Opportunity Cost Analysis

### Highest Opportunity Cost Items

1. **Mithril Flowers** — Use for Mithril Pollen (unlocks Adamantine tier) OR direct Rare beetle craft. **Decision: Pollen first, Rare beetles from extras.**

2. **Adamantine Flowers** — Use for Adamantine Pollen (Diamond Hammer/Hercules) OR Epic beetle craft. **Decision: Need exactly 1 Pincushion + 1 Gazania for Mars Rhino chain. Only pollen from extras.**

3. **Adamantine Beetles** — Use for Epic beetle craft OR Adamantine flower transmutation. **Decision: Transmutation is expensive. Prefer flower tier-up from Mithril flowers when possible.**

4. **Mithril Artifacts** — Use for Adamantine beetle craft (need 1 each) OR Black Lotus (need all 3 at once). **Decision: Adamantine beetles first. Black Lotus needs a SECOND full set of all 3.**

---

## Optimal Crafting Order (Stage 4 Player)

### Priority 1 — Secure the artifact pipeline
1. Make Mithril Pollen (2 Mithril flowers)
2. Run Mithril beetle + Mithril Pollen for Pinecone/Moss/Gunpowder
3. Need at least 1 of each for Adamantine beetles

### Priority 2 — Build Adamantine beetles
4. Pinecone + Mithril beetle -> Goliath
5. Moss + Mithril beetle -> Stag
6. Gunpowder + Mithril beetle -> Bombardier

### Priority 3 — Rare beetles (from extra Mithril flowers)
7. Royal Poinciana + Mithril beetle -> Giraffe Weevil
8. Camellia + Mithril beetle -> Pillbug
9. Morning Glory + Mithril beetle -> Imperial Tortoise

### Priority 4 — Epic tier
10. Get Adamantine flowers (tier-up 2 Mithril flowers, or transmute)
11. Pincushion + Adamantine beetle -> Sabertooth Longhorn
12. Gazania + Adamantine beetle -> Sunset Moth

### Priority 5 — Endgame
13. Second set of all 3 artifacts for Black Lotus
14. Black Lotus + Sunset Moth + Sabertooth -> Mars Rhino
15. Golden Scarab + Adamantine Pollen + Purple -> Hercules

### Key Rule
**NEVER use your last Mithril beetle on a low-priority craft.** Budget: minimum 12+ Mithril beetles for full collection run.

---

## Resource Budget (Full Collection)

| Resource | Minimum Needed | Base Unit Cost |
|----------|---------------|----------------|
| Mithril beetles consumed | 15-20 | 525-700 |
| Bronze Pollen batches | 5-8 | 68-108 |
| Mithril Pollen batches | 4-6 | 480-720 |
| Junk Tesseracts | 4-5 | 24-30 |
| Adamantine beetles consumed | 4-6 | 1600-2400 |
| Adamantine flowers consumed | 4-6 | 1640-2460 |
| **Total for full collection** | | **~5000-7000+** |

~5000-7000 catch-equivalent farming actions for complete collection, assuming average RNG.

---

## Hammer Usage Guide

### Match hammer to recipe value (v8.7 recommendation engine)

| Recipe Value | Hammer Tier | Examples |
|---|---|---|
| 1-20 | Cheapest available (Tin/Bronze) | Tin Pollen, Junk Tesseract, Bronze Pollen |
| 21-50 | Bronze+ | Nectar/Cattail Bridge, Mithril Bridge, Mithril Pollen |
| 51-75 | Mithril+ | Goliath, Stag, Bombardier, Rare beetles |
| 76+ | Best available (Adamantine/Diamond) | Epic beetles, Black Lotus, Mars Rhino |

### EV analysis for hammer selection
- **Tin Hammer** on Tin Pollen (value 5): if it breaks, you lose 4 base units. EV loss = 0.4. Acceptable.
- **Adamantine Hammer** on Tin Pollen (value 5): if it breaks, you lose 159 base units. EV loss = 3.18. WASTEFUL.
- **Adamantine Hammer** on Goliath Beetle (value 60): if it breaks, you lose 159 base units. EV gain from +35% bonus is significant. Acceptable.
- **Diamond Hammer** on Mars Rhino (value 95): +90% bonus on a 7688 base cost recipe. Worth the 1% break risk.

### Key rule
**Always re-craft broken cheap hammers before risking expensive ones on low-value crafts.**
A broken Tin Hammer costs 2 Junk Cubes (4 base units) to replace. Using Adamantine for a Tin Pollen craft risks 159 base units for a 5-value output.

---

## Corrections log

### v8.7 (April 7, 2026)
- Pollen recipes are ASSEMBLE (100% success), not smash — confirmed by beetle.wiki
- Hammer states detectable from DOM: owned / broken (--empty) / undiscovered
- Goliath, Stag, Golden Scarab confirmed droppable from catches (beetle.wiki)
- 27 confirmed anti-recipes (dead combos) documented
- Golden Scarab is drop-only (Diamond rarity) — no crafting recipe exists
