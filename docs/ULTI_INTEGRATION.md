# solMaxima · Ulti points and the English League

Ulti points live only in Mr. Saymaz's English League (the tally system). solMaxima uses the same protocol as Wordramp. Its League id is **`solmaxima`**.

## What earns Ulti

A completed area, meaning a won guardian fight at the end of a six-gate area, adds Ulti points to the student's **(grade, team)** pool. For example, Grade 5 Hufflepuff has its own pool, and Grade 7 Slytherin has another.

- **The team** is the creature's team (`gryffindor`, `hufflepuff`, `slytherin`, `ravenclaw`).
- **The grade** comes from the selected lesson (unit).
- Ulti cannot be spent. They fade after the number of hours the League keeps them (7 days = 168 hours).
- Nothing else earns Ulti:
  - not coins;
  - not lives;
  - not a restart after running out of lives;
  - not a retreat from the arena.

## The League line

Add this to the `games` section of the ULTI block in the Apps Script:

```
solmaxima: { points: { relaxed: [8, 12, 16], challenge: [12, 16, 20] }, deviceDailyWins: 3, minSeconds: 480 },
```

- **points:** Ulti per arena, in order Area 1, Area 2, Area 3. Relaxed gives 8 / 12 / 16 and Challenge gives 12 / 16 / 20.
- **deviceDailyWins:** the most wins counted per device per day. Change it freely.
- **minSeconds:** the shortest honest time from an area's start ticket to its win. A full six-gate area takes about 15–20 minutes. The fastest perfect play (every task right first time, the guardian beaten without a hit) takes roughly 9–10 minutes. 480 seconds (8 minutes) leaves a safe margin.
- **How long Ulti last (7 days):** this is the League's `hours` setting, 168. If your script allows `hours` per game, add `hours: 168` to the line; otherwise it is the League-wide setting.

Every value is read from the League, so changes in the spreadsheet take effect without a new game build. The game never sends a points value and holds no key.

## Configuration

`config.js` sets `window.SOLMAXIMA_CONFIG = { ultiApi: 'https://mrsaymaz.netlify.app/api/ulti' }`.

With `ultiApi: ''` the copy is practice-only: no League card, no Ulti messages and no network requests.

## Requests

- **Start:** when an area is played, the game sends `{action:'start', game:'solmaxima', grade, team, arena, pace, unit, device}`.
  - `arena` is 0–2 and `pace` is `relaxed` or `challenge`.
  - The ticket is kept in this browser under the area's run, so a paused or reloaded game can still claim.
  - If the device is offline, it asks again after each gate.
  - An area played over several days swaps a ticket older than 30 hours for a fresh one, but only before its second gate, so `minSeconds` still holds.
- **Claim:** `{action:'claim', ticket, device}` is sent only after the guardian is defeated.
  - A network failure, a 5xx reply or `retry: true` keeps the ticket in an outbox. The outbox is resent on the next launch, and items are dropped after 47 hours.
  - A 400 refusal (`too-fast`, `expired` or any other) is final.
- **Pools:** `{action:'pools', grade}` is sent when the journal's Rewards tab opens (at most once a minute). The last reply is cached.
- **Device:** a random 24-character id, made once and kept in localStorage.

## What students see

- **At the Elemental Shrine:** "Win: +8 Ulti for Grade 5 Hufflepuff", once the League's settings are known.
- **After the guardian win:** a banner with the Ulti crystal, for example "+8 Ulti for Grade 5 Hufflepuff!". There is a message for every other outcome too:
  - device limit or team limit;
  - the League being off;
  - too fast;
  - an expired ticket;
  - a win queued while offline;
  - an area that never got a ticket.
- **Journal → Rewards:** the four team pools for the grade, the student's team highlighted, and how many days Ulti last.
