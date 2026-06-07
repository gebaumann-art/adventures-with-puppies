// PetCareSystem — gentle Tamagotchi-style puppy needs.
// Tracks four needs (hunger, walk, training, happiness).  They drain slowly
// over real time and fill from normal in-game actions.  The game is fully
// playable regardless of care level — low needs just show friendly reminders
// and caring for the dog gives small XP bonuses.

const NEEDS = ['hunger', 'walk', 'training', 'happiness'];

// How fast each need drains (% per real second).
// At the rates below the needs empty over 40-70 minutes of idle play time.
const DRAIN = {
  hunger:    100 / (45 * 60),   // empty in 45 min
  walk:      100 / (50 * 60),   // empty in 50 min (constantly refilled by movement)
  training:  100 / (70 * 60),   // empty in 70 min
  happiness: 100 / (45 * 60),   // empty in 45 min
};

// Show a gentle reminder once a need drops below this %
const LOW_THRESHOLD = 28;
// Minimum real seconds between reminders for the same need
const REMINDER_COOLDOWN_S = 4 * 60; // 4 minutes

// How many world-units of movement fill the walk bar from 0 → 100.
// At PLAYER_SPEED = 18 units/s this takes ~2 minutes of walking.
const WALK_UNITS_FOR_FULL = 2200;

export class PetCareSystem {
  /**
   * @param {object} gameState  The shared gameState object (persisted to localStorage).
   */
  constructor(gameState) {
    this.gameState = gameState;

    // Seed petCare into gameState if this is a fresh save.
    if (!gameState.petCare) {
      gameState.petCare = { hunger: 100, walk: 100, training: 100, happiness: 100 };
    } else {
      // Clamp any out-of-range values from old saves.
      for (const n of NEEDS) {
        gameState.petCare[n] = Math.max(0, Math.min(100, gameState.petCare[n] ?? 100));
      }
    }

    // Cooldown timestamps (ms) for reminder notifications, keyed by need name.
    this._lastReminder = Object.fromEntries(NEEDS.map(n => [n, 0]));

    // Optional callback fired when a need drops below LOW_THRESHOLD.
    // Signature: (needName: string, value: number) => void
    this.onReminder = null;

    // Optional callback fired whenever any need value changes.
    // Signature: (needs: object) => void
    this.onChange = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Drain all needs by their per-second rate.  Call once per frame.
   * @param {number} dt  Real-world seconds since last frame.
   */
  update(dt) {
    const care = this.gameState.petCare;
    let changed = false;
    const now = Date.now();

    for (const n of NEEDS) {
      const before = care[n];
      care[n] = Math.max(0, before - DRAIN[n] * dt);
      if (care[n] !== before) changed = true;

      // Gentle reminder when low — rate-limited per need.
      if (care[n] < LOW_THRESHOLD &&
          now - this._lastReminder[n] > REMINDER_COOLDOWN_S * 1000) {
        this._lastReminder[n] = now;
        if (this.onReminder) this.onReminder(n, care[n]);
      }
    }

    if (changed && this.onChange) this.onChange({ ...care });
  }

  /**
   * The dog was fed — restore hunger to 100.
   * Returns true (always succeeds, food is free).
   */
  onFed() {
    this.gameState.petCare.hunger = 100;
    this._emit();
    return true;
  }

  /**
   * Record movement distance (world units walked this frame).
   * At PLAYER_SPEED = 18 u/s, ~2 min of walking fills the walk bar.
   * @param {number} meters  World-units moved this frame.
   */
  addWalkMeters(meters) {
    const care = this.gameState.petCare;
    care.walk = Math.min(100, care.walk + (meters / WALK_UNITS_FOR_FULL) * 100);
    if (this.onChange) this.onChange({ ...care });
  }

  /**
   * The dog completed a training activity (agility, obstacle course,
   * grooming check-up, etc.).  Adds 45 % to the training bar.
   */
  onTrained() {
    const care = this.gameState.petCare;
    care.training   = Math.min(100, care.training   + 45);
    care.happiness  = Math.min(100, care.happiness  + 15);
    this._emit();
  }

  /**
   * The dog had fun (trivia correct, fetch, dog show, etc.).
   * Adds 30 % to the happiness bar.
   */
  onHappened() {
    const care = this.gameState.petCare;
    care.happiness = Math.min(100, care.happiness + 30);
    this._emit();
  }

  /** Returns a shallow copy of the current needs object. */
  getNeeds() {
    return { ...this.gameState.petCare };
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  _emit() {
    if (this.onChange) this.onChange({ ...this.gameState.petCare });
  }
}
