import { getBreed } from '../data/breeds.js';

// XP thresholds for each growth stage
const XP_PUPPY_TO_ADOLESCENT = 100;
const XP_ADOLESCENT_TO_ADULT = 300;

// Time thresholds in milliseconds (real time)
const TIME_PUPPY_TO_ADOLESCENT = 2 * 24 * 60 * 60 * 1000; // 2 days
const TIME_ADOLESCENT_TO_ADULT = 4 * 24 * 60 * 60 * 1000; // 4 days

export function createDog(breedId, name) {
  return {
    id: `dog_${Date.now()}`,
    breedId,
    name: name || 'My Puppy',
    stage: 'puppy', // 'puppy' | 'adolescent' | 'adult'
    xp: 0,
    createdAt: Date.now(),
    accessories: [],
    lastTrainedAt: 0,
  };
}

export function addXP(dog, amount) {
  dog.xp += amount;
  updateStage(dog);
  return dog;
}

export function updateStage(dog) {
  const elapsed = Date.now() - dog.createdAt;
  const xpReady = dog.xp >= XP_PUPPY_TO_ADOLESCENT;
  const timeReady = elapsed >= TIME_PUPPY_TO_ADOLESCENT;

  if (dog.stage === 'puppy' && xpReady && timeReady) {
    dog.stage = 'adolescent';
  }

  const xpFull = dog.xp >= XP_ADOLESCENT_TO_ADULT;
  const timeFull = elapsed >= TIME_PUPPY_TO_ADOLESCENT + TIME_ADOLESCENT_TO_ADULT;

  if (dog.stage === 'adolescent' && xpFull && timeFull) {
    dog.stage = 'adult';
  }
}

// Returns 0–100 progress toward next stage
export function getStageProgress(dog) {
  const elapsed = Date.now() - dog.createdAt;
  if (dog.stage === 'puppy') {
    const xpPct = Math.min(dog.xp / XP_PUPPY_TO_ADOLESCENT, 1);
    const timePct = Math.min(elapsed / TIME_PUPPY_TO_ADOLESCENT, 1);
    return Math.round(((xpPct + timePct) / 2) * 100);
  }
  if (dog.stage === 'adolescent') {
    const xpPct = Math.min((dog.xp - XP_PUPPY_TO_ADOLESCENT) / (XP_ADOLESCENT_TO_ADULT - XP_PUPPY_TO_ADOLESCENT), 1);
    const timePct = Math.min((elapsed - TIME_PUPPY_TO_ADOLESCENT) / TIME_ADOLESCENT_TO_ADULT, 1);
    return Math.round(((xpPct + timePct) / 2) * 100);
  }
  return 100;
}

export function canTrain(dog) {
  const cooldown = 60 * 60 * 1000; // 1 hour
  return Date.now() - dog.lastTrainedAt >= cooldown;
}

export function markTrained(dog) {
  dog.lastTrainedAt = Date.now();
}

export function getDogDisplayEmoji(dog) {
  const breed = getBreed(dog.breedId);
  return breed.stages[dog.stage] || breed.emoji;
}

export function getStageName(stage) {
  return { puppy: 'Puppy', adolescent: 'Teen Pup', adult: 'Adult Dog' }[stage] || 'Puppy';
}
