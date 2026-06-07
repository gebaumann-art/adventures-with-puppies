// ScavengerHuntSystem.js — multi-step scavenger hunts spread across game zones.
// Each hunt is a series of riddle clues; the player finds the marker in-world
// to advance.  State is stored directly on gameState so it survives saves.

export const SCAVENGER_HUNTS = [
  // ── Hunt 1 — Downtown ─────────────────────────────────────────────────
  {
    id: 'sh_bones',
    title: 'The Great Bone Hunt',
    intro: 'Ana heard some bones were hidden around town! Follow the clues...',
    npcStart: 'Ana',
    steps: [
      {
        clue: 'I am tall and red and ring a bell...\nLook near where helpers put out fires!',
        hintZone: 'downtown',
        answer: 'fire_hydrant',
        markerPos: { x: 5, z: -45 },
      },
      {
        clue: 'People sit on me to rest their feet,\nYou\'ll find me on a shady downtown street!',
        hintZone: 'downtown',
        answer: 'park_bench',
        markerPos: { x: -12, z: -38 },
      },
      {
        clue: 'I hold letters big and small,\nA blue box standing by the wall!',
        hintZone: 'downtown',
        answer: 'mailbox',
        markerPos: { x: 18, z: -52 },
      },
      {
        clue: 'Puppies drink from me when thirsty on the go,\nFind the low fountain where the water flows!',
        hintZone: 'downtown',
        answer: 'dog_fountain',
        markerPos: { x: 3, z: -60 },
      },
      {
        clue: 'The last bone is where the paws press in,\nCheck the big paw-print sign — and win!',
        hintZone: 'downtown',
        answer: 'paw_sign',
        markerPos: { x: -5, z: -70 },
      },
    ],
    reward: { coins: 50, bones: 5, achievementId: 'great_bone_hunter' },
  },

  // ── Hunt 2 — Dog Park ──────────────────────────────────────────────────
  {
    id: 'sh_park',
    title: 'Park Pals Adventure',
    intro: 'Bingo says something sparkly was buried in the dog park. Can you sniff it out?',
    npcStart: 'Bingo',
    steps: [
      {
        clue: 'I go round and round all day,\nPuppies chase me when they play!',
        hintZone: 'dog_park',
        answer: 'spinning_wheel',
        markerPos: { x: 30, z: 20 },
      },
      {
        clue: 'I am made of rope and hang up high,\nPuppies jump and swing — oh my!',
        hintZone: 'dog_park',
        answer: 'rope_swing',
        markerPos: { x: 38, z: 14 },
      },
      {
        clue: 'I\'m a tunnel dogs run through with glee,\nHop inside and you might find the key!',
        hintZone: 'dog_park',
        answer: 'agility_tunnel',
        markerPos: { x: 42, z: 28 },
      },
      {
        clue: 'Water splashes, puppies cool down here,\nLook beside the splash pad — it\'s near!',
        hintZone: 'dog_park',
        answer: 'splash_pad',
        markerPos: { x: 25, z: 35 },
      },
      {
        clue: 'The final clue is under something tall and green,\nThe biggest oak tree in the park — if you know what I mean!',
        hintZone: 'dog_park',
        answer: 'oak_tree',
        markerPos: { x: 20, z: 10 },
      },
    ],
    reward: { coins: 40, bones: 4, achievementId: 'park_pals_champ' },
  },

  // ── Hunt 3 — Beach ─────────────────────────────────────────────────────
  {
    id: 'sh_beach',
    title: 'Treasure Tails at the Shore',
    intro: 'Rolly found a note in a bottle — there\'s treasure buried at the beach!',
    npcStart: 'Rolly',
    steps: [
      {
        clue: 'I am striped with red and white,\nGuarding swimmers day and night!',
        hintZone: 'beach',
        answer: 'lifeguard_tower',
        markerPos: { x: -40, z: 60 },
      },
      {
        clue: 'People rent me when the sun shines bright,\nA colorful umbrella keeping off the light!',
        hintZone: 'beach',
        answer: 'beach_umbrella',
        markerPos: { x: -52, z: 68 },
      },
      {
        clue: 'I float and bob out on the blue,\nA little buoy — can you find me too?',
        hintZone: 'beach',
        answer: 'buoy',
        markerPos: { x: -60, z: 55 },
      },
      {
        clue: 'I\'m where surfers wax their boards with care,\nThe surf shack by the water — I\'m there!',
        hintZone: 'beach',
        answer: 'surf_shack',
        markerPos: { x: -35, z: 75 },
      },
      {
        clue: 'Look for the big sandcastle near the sea,\nThe treasure waits right under me!',
        hintZone: 'beach',
        answer: 'sandcastle',
        markerPos: { x: -48, z: 80 },
      },
    ],
    reward: { coins: 60, bones: 6, achievementId: 'shore_treasure_finder' },
  },

  // ── Hunt 4 — Neighborhood ──────────────────────────────────────────────
  {
    id: 'sh_neighborhood',
    title: 'Neighborhood Nose Trail',
    intro: 'A mystery smell is leading through the neighborhood. Follow your nose!',
    npcStart: 'Max',
    steps: [
      {
        clue: 'I buzz and glow when the sun goes down,\nA lamp post lighting up the town!',
        hintZone: 'neighborhood',
        answer: 'lamp_post',
        markerPos: { x: -20, z: -10 },
      },
      {
        clue: 'Letters and packages come to me,\nCheck the mailbox near the big oak tree!',
        hintZone: 'neighborhood',
        answer: 'neighborhood_mailbox',
        markerPos: { x: -28, z: -5 },
      },
      {
        clue: 'I am a cozy spot for birds to eat,\nA little house on a pole — isn\'t that neat?',
        hintZone: 'neighborhood',
        answer: 'birdhouse',
        markerPos: { x: -15, z: -18 },
      },
      {
        clue: 'Squeak! Squeak! I\'m left in the yard,\nA forgotten chew toy — finding me is hard!',
        hintZone: 'neighborhood',
        answer: 'chew_toy',
        markerPos: { x: -32, z: -22 },
      },
      {
        clue: 'The last clue hides near the welcome sign,\nAt the entrance to the street — it\'s looking fine!',
        hintZone: 'neighborhood',
        answer: 'welcome_sign',
        markerPos: { x: -10, z: -30 },
      },
    ],
    reward: { coins: 45, bones: 5, achievementId: 'neighborhood_nose' },
  },
];

// ── State helpers ──────────────────────────────────────────────────────────

function _ensureHuntState(gameState) {
  if (!gameState.scavengerHunts) {
    gameState.scavengerHunts = {};
  }
}

function _saveGameState(gameState) {
  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Begin a hunt.  Creates state for it so getCurrentStep / completeStep work.
 * Returns false if hunt already complete.
 */
export function startHunt(gameState, huntId) {
  _ensureHuntState(gameState);
  const hunt = SCAVENGER_HUNTS.find((h) => h.id === huntId);
  if (!hunt) return false;

  if (gameState.scavengerHunts[huntId] && gameState.scavengerHunts[huntId].complete) {
    return false; // already done
  }

  if (!gameState.scavengerHunts[huntId]) {
    gameState.scavengerHunts[huntId] = {
      started: true,
      currentStep: 0,
      complete: false,
      startedAt: Date.now(),
    };
  }

  _saveGameState(gameState);
  return true;
}

/**
 * Returns the current step object for a hunt, or null if not started / complete.
 */
export function getCurrentStep(gameState, huntId) {
  _ensureHuntState(gameState);
  const hunt = SCAVENGER_HUNTS.find((h) => h.id === huntId);
  if (!hunt) return null;

  const state = gameState.scavengerHunts[huntId];
  if (!state || !state.started || state.complete) return null;

  const idx = state.currentStep;
  if (idx >= hunt.steps.length) return null;

  return { ...hunt.steps[idx], stepIndex: idx, totalSteps: hunt.steps.length };
}

/**
 * Mark a step as found.  Advances currentStep or marks hunt complete.
 * Returns { advanced: bool, complete: bool, reward? }
 */
export function completeStep(gameState, huntId, stepIndex) {
  _ensureHuntState(gameState);
  const hunt = SCAVENGER_HUNTS.find((h) => h.id === huntId);
  if (!hunt) return { advanced: false, complete: false };

  const state = gameState.scavengerHunts[huntId];
  if (!state || !state.started || state.complete) return { advanced: false, complete: false };

  // Guard: must match the current expected step
  if (state.currentStep !== stepIndex) return { advanced: false, complete: false };

  state.currentStep = stepIndex + 1;

  if (state.currentStep >= hunt.steps.length) {
    state.complete = true;
    state.completedAt = Date.now();
    _saveGameState(gameState);
    return { advanced: true, complete: true, reward: hunt.reward };
  }

  _saveGameState(gameState);
  return { advanced: true, complete: false };
}

/**
 * Returns true if the hunt has been fully completed.
 */
export function isHuntComplete(gameState, huntId) {
  _ensureHuntState(gameState);
  const state = gameState.scavengerHunts[huntId];
  return !!(state && state.complete);
}

/**
 * Returns hunts that are available to start (not yet complete).
 * A hunt is available when the player has not already finished it.
 */
export function getAvailableHunts(gameState) {
  _ensureHuntState(gameState);
  return SCAVENGER_HUNTS.filter((hunt) => {
    const state = gameState.scavengerHunts[hunt.id];
    return !(state && state.complete);
  });
}
