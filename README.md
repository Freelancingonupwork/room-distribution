# Room Assignments (TypeScript)

A simple, readable solution to allocate people into hotel rooms with the following criteria:

- Every room is "non‑empty".
- No room exceeds "4 occupants" (configurable).
- "Children are never alone" — they must share a room with at least one "adult" or "senior".
- "Seniors are grouped together" where possible (senior‑only rooms first, without breaking other rules).
- Remaining people are spread fairly using simple passes (no complex maths).
- Final output is sorted by adults desc, then seniors desc, then children desc.

---

## Requirements

- **Node.js** (LTS recommended)
- **npm** (bundled with Node)
- Shell: **bash** (Git Bash / WSL / macOS Terminal)

> Linting/formatting is set up with **ESLint v9 (flat config)** and **Prettier** - For formatting and coding standards.

---

## Features & Rules (with example)

1) **Room Capacity (default: 4)**  
   Each room can hold up to 4 people. If total people > rooms × 4 → **impossible**.

2) **No Empty Rooms**  
   If total people < rooms → you cannot fill all rooms → **impossible**.

3) **Children Are Never Alone**  
   Any child must have at least one adult/senior in the same room. If children > 0 and adults + seniors = 0 → **impossible**.

4) **Seniors Grouping**  
   We try to make senior‑only rooms first, as long as it doesn’t break capacity, non‑empty, or chaperone rules.

5) **Fair Distribution**  
   After the basics, we add people in simple passes:
   - Seniors to rooms that already have seniors (keep them together), then anywhere.
   - Adults to mixed rooms first (so senior‑only rooms stay mostly seniors).
   - Children to rooms with adults first, then rooms with seniors (children are always chaperoned).

6) **Final Sorting**  
   Output rooms are sorted by adults → seniors → children (all **descending**).

### Example

**Input**  
- Rooms: 2, Adults: 2, Seniors: 2, Children: 1

**Result**  
```json
[
  { "adults": 2, "seniors": 0, "children": 1 },
  { "adults": 0, "seniors": 2, "children": 0 }
]
```

Explanation: One senior‑only room (2 seniors). Other room seeded by adults; child goes with adults. All rules satisfied and result sorted.

---

## Project Structure

```
src/
  constants/limits.ts          # shared limits (e.g., ROOM_CAPACITY = 4)
  types/Room.ts                # Room interface (adults, seniors, children)
  models/RoomBox.ts            # tiny helper class (capacity & add methods)
  services/RoomAllocator.ts    # RoomAllocator class (allocate method)
  index.ts                     # Sample call

test/
  RoomAllocator.test.ts        # unit tests (Vitest)
# (or keep the test under src/test/, then adjust the import path accordingly)
```

---

## Install & Run (quick)

```bash
# 1) Install dependencies
npm i

# 2) Run the sample (edit numbers in src/index.ts if you like)
npm run dev

# 3) Coding standards -- Optional
npm run lint        # check
npm run fix         # auto‑fix
npm run fmt:write   # format with Prettier

# 4) Build TypeScript → dist/
npm run build

# 5) Tests (Vitest)
npm test            # run once
# npm run test:watch  # watch mode (optional)
```

---

## Usage (in code)

```ts
// src/index.ts
import { RoomAllocator } from './services/RoomAllocator';

const allocator = new RoomAllocator();

// (rooms, adults, seniors, children)
const result = allocator.allocate(2, 2, 2, 1);
console.log(result);
```

---

## Configuration

- **Room capacity** lives in `src/constants/limits.ts`:
  ```ts
  export const ROOM_CAPACITY = 4;
  ```
  Change it if your requirement differs.

---

## Notes & Tips

- The code uses only **simple loops** and **small helpers**; no complex logic, so it’s easy to maintain.
- If you move test files under `src/test/`, import the class with:
  ```ts
  import { RoomAllocator } from '../services/RoomAllocator';
  ```
