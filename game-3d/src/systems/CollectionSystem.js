// Adventures With Puppies — Collection System (Sticker Book)
// Derives a set of collectible "stickers" PURELY from the existing gameState.
// No event hooks anywhere else — everything here is computed on demand from
// data the game already tracks (owned breeds, bones, coins, dog stage, etc.).

import { getBreed } from '../data/breeds.js';
import { getStreakCount } from './AcademySystem.js';

// Stable list of breed stickers — one per breed in the game. A breed sticker
// unlocks once that breed appears in gameState.ownedBreeds.
const BREED_STICKER_DEFS = [
  { id: 'breed_pug',       breedId: 'pug',       emoji: '🐶', name: 'Pug Pal',          hint: 'Start your adventure with a Pug!' },
  { id: 'breed_labrador',  breedId: 'labrador',  emoji: '🦮', name: 'Lab Buddy',        hint: 'Adopt a Labrador from the shop.' },
  { id: 'breed_golden',    breedId: 'golden',    emoji: '🐕‍🦺', name: 'Golden Friend',    hint: 'Adopt a Golden Retriever from the shop.' },
  { id: 'breed_dalmatian', breedId: 'dalmatian', emoji: '🐕', name: 'Spotty Star',       hint: 'Adopt a Dalmatian from the shop.' },
  { id: 'breed_beagle',    breedId: 'beagle',    emoji: '🐶', name: 'Beagle Best',       hint: 'Adopt a Beagle from the shop.' },
  { id: 'breed_husky',     breedId: 'husky',     emoji: '🐺', name: 'Husky Hero',        hint: 'Adopt a Siberian Husky from the shop.' },
];

/**
 * Returns the full sticker catalog with each sticker's unlocked state computed
 * from the current gameState. ~14 stickers total.
 * @param {object} gameState
 * @returns {Array<{id, emoji, name, hint, unlocked}>}
 */
export function getCollection(gameState) {
  const gs = gameState || {};
  const ownedBreeds = gs.ownedBreeds || [];
  const ownedAccessories = gs.ownedAccessories || [];
  const answeredTrivia = gs.answeredTrivia || [];
  const bones = gs.bones || 0;
  const coins = gs.coins || 0;
  const dog = gs.currentDog || {};
  const stage = dog.stage || 'puppy';

  let streak = 0;
  try { streak = getStreakCount(gs) || 0; } catch (_) { streak = 0; }

  const stickers = [];

  // ── One sticker per breed (unlocked when owned) ──────────────────────────
  for (const def of BREED_STICKER_DEFS) {
    // Prefer the breed's grown-up emoji for a nicer sticker when available.
    let emoji = def.emoji;
    try {
      const breed = getBreed(def.breedId);
      if (breed && breed.stages && breed.stages.adult) emoji = breed.stages.adult;
    } catch (_) {}
    stickers.push({
      id: def.id,
      emoji,
      name: def.name,
      hint: def.hint,
      unlocked: ownedBreeds.includes(def.breedId),
    });
  }

  // ── Milestone / achievement stickers (derived from tracked totals) ───────
  stickers.push({
    id: 'bone_hunter',
    emoji: '🦴',
    name: 'Bone Hunter',
    hint: 'Collect 10 bones around the world.',
    unlocked: bones >= 10,
  });
  stickers.push({
    id: 'coin_collector',
    emoji: '🪙',
    name: 'Coin Collector',
    hint: 'Save up 50 coins.',
    unlocked: coins >= 50,
  });
  stickers.push({
    id: 'growing_up',
    emoji: '🐕',
    name: 'Growing Up',
    hint: 'Help your puppy grow past the puppy stage.',
    unlocked: stage !== 'puppy',
  });
  stickers.push({
    id: 'all_grown_up',
    emoji: '🏅',
    name: 'All Grown Up',
    hint: 'Raise your puppy all the way to an adult dog.',
    unlocked: stage === 'adult',
  });
  stickers.push({
    id: 'trivia_whiz',
    emoji: '🧠',
    name: 'Trivia Whiz',
    hint: 'Answer 5 trivia questions.',
    unlocked: answeredTrivia.length >= 5,
  });
  stickers.push({
    id: 'accessorized',
    emoji: '🎩',
    name: 'Fancy Pup',
    hint: 'Buy an accessory for your dog.',
    unlocked: ownedAccessories.length >= 1,
  });
  stickers.push({
    id: 'streak_star',
    emoji: '🔥',
    name: 'Streak Star',
    hint: 'Get a learning streak of 3 in a row.',
    unlocked: streak >= 3,
  });

  // ── Aspirational locked-only goals (always shown as something to chase) ──
  stickers.push({
    id: 'pack_leader',
    emoji: '👑',
    name: 'Pack Leader',
    hint: 'Collect 3 different dog breeds.',
    unlocked: ownedBreeds.length >= 3,
  });
  stickers.push({
    id: 'bone_baron',
    emoji: '💰',
    name: 'Bone Baron',
    hint: 'Gather 50 bones in all.',
    unlocked: bones >= 50,
  });

  return stickers;
}

/**
 * Returns the unlocked / total counts for the sticker collection.
 * @param {object} gameState
 * @returns {{ unlocked: number, total: number }}
 */
export function getCollectionCount(gameState) {
  const stickers = getCollection(gameState);
  const unlocked = stickers.filter(s => s.unlocked).length;
  return { unlocked, total: stickers.length };
}

export default { getCollection, getCollectionCount };
