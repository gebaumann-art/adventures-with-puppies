// Adventures With Puppies — Achievement System
// Tracks and unlocks achievements defined in ../data/achievements.js

import { ACHIEVEMENTS } from '../data/achievements.js';

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveGameState(gameState) {
  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initAchievements(gameState) {
  if (!gameState.achievements) {
    gameState.achievements = {
      unlocked: {},   // { [id]: { unlockedAt: ISO-string } }
    };
  }
  if (!gameState.achievements.unlocked) {
    gameState.achievements.unlocked = {};
  }
  return gameState;
}

// ─── Condition evaluation ────────────────────────────────────────────────────

// Returns true if the achievement's condition is satisfied given the current
// gameState and the triggerData from the latest event.
function evaluateCondition(condition, gameState, triggerData) {
  const stats = gameState.stats || {};
  const acad  = gameState.academy || {};
  const { type } = condition;

  switch (type) {

    // ── Exploring ──────────────────────────────────────────────────────────

    case 'bones_collected':
      return (stats.bonesCollectedTotal || 0) >= condition.threshold;

    case 'fishing_attempts':
      return (stats.fishingAttempts || 0) >= condition.threshold;

    case 'fish_caught':
      return (stats.fishCaught || 0) >= condition.threshold;

    case 'zones_visited':
      return (stats.zonesVisited || []).includes(condition.zone);

    case 'all_zones_visited': {
      const allZones = gameState.worldZones || [];
      const visited  = stats.zonesVisited || [];
      return allZones.length > 0 && allZones.every(z => visited.includes(z));
    }

    case 'zone_visits':
      return ((stats.zoneVisitCounts || {})[condition.zone] || 0) >= condition.threshold;

    case 'hidden_items_found':
      return (stats.hiddenItemsFound || 0) >= condition.threshold;

    // ── Learning ───────────────────────────────────────────────────────────

    case 'trivia_answered':
      return (stats.triviaAnswered || 0) >= condition.threshold;

    case 'correct_streak':
      return (acad.streak || 0) >= condition.threshold;

    case 'reading_passages_complete':
      return (stats.readingPassagesComplete || 0) >= condition.threshold;

    case 'words_spelled_correctly':
      return (stats.wordsSpelledCorrectly || 0) >= condition.threshold;

    case 'perfect_quiz':
      // Checked via triggerData on the 'perfect_quiz' event
      if (triggerData.event === 'perfect_quiz') {
        return (triggerData.value || 0) >= (condition.length || 1);
      }
      return false;

    case 'perfect_spelling_round':
      return triggerData.event === 'perfect_spelling_round';

    case 'learning_day_streak':
      return (stats.learningDayStreak || 0) >= condition.threshold;

    case 'timed_correct_answers':
      // triggerData.value = { count, seconds }
      if (triggerData.event === 'timed_correct_answers') {
        const v = triggerData.value || {};
        return v.count >= condition.count && v.seconds <= condition.seconds;
      }
      return false;

    case 'subject_complete': {
      const subj = acad[condition.subject] || {};
      const topics = subj.topicsCompleted || [];
      // Get expected topic list for this subject from DAILY_CHALLENGE_POOL keys or
      // treat as complete when flagged via triggerData
      if (condition.perfect) {
        // Perfect completion: ≥ 90% accuracy AND all topics done
        if (triggerData.event === 'subject_complete' && triggerData.value === condition.subject) {
          const answered = subj.questionsAnswered || 0;
          const correct  = subj.questionsCorrect  || 0;
          return answered > 0 && (correct / answered) >= 0.9;
        }
        return false;
      }
      // Standard: flagged via triggerData
      return triggerData.event === 'subject_complete' && triggerData.value === condition.subject;
    }

    case 'all_subjects_complete':
      return triggerData.event === 'all_subjects_complete';

    // ── Growth ─────────────────────────────────────────────────────────────

    case 'stage_reached':
      return triggerData.event === 'stage_reached' && triggerData.value === condition.stage;

    case 'accessories_equipped':
      return (stats.accessoriesEverEquipped || 0) >= condition.threshold;

    case 'accessories_owned':
      return ((gameState.ownedAccessories || []).length) >= condition.threshold;

    case 'player_level':
      return (gameState.level || 1) >= condition.threshold;

    case 'breeds_unlocked':
      return ((gameState.unlockedBreeds || []).length) >= condition.threshold;

    case 'all_breeds_unlocked': {
      const allBreeds = gameState.allBreeds || [];
      const unlocked  = gameState.unlockedBreeds || [];
      return allBreeds.length > 0 && allBreeds.every(b => unlocked.includes(b));
    }

    case 'coins_held':
      return (gameState.coins || 0) >= condition.threshold;

    case 'coins_spent':
      return (stats.coinsSpentTotal || 0) >= condition.threshold;

    // ── Social ─────────────────────────────────────────────────────────────

    case 'npcs_talked_to':
      return ((stats.npcsTalkedTo || []).length) >= condition.threshold;

    case 'all_npcs_talked_to': {
      const allNpcs = gameState.allNpcs || [];
      const talked  = stats.npcsTalkedTo || [];
      return allNpcs.length > 0 && allNpcs.every(n => talked.includes(n));
    }

    case 'scavenger_hunts_complete':
      return (stats.scavengerHuntsComplete || 0) >= condition.threshold;

    case 'dog_show_entries':
      return (stats.dogShowEntries || 0) >= condition.threshold;

    case 'dog_show_win':
      return triggerData.event === 'dog_show_win';

    case 'daily_challenges_complete':
      return ((acad.dailyChallenge || {}).completedIds || []).length >= condition.threshold;

    case 'daily_challenge_streak':
      return ((acad.dailyChallenge || {}).streakDays || 0) >= condition.threshold;

    case 'npc_quests_complete':
      return (stats.npcQuestsComplete || 0) >= condition.threshold;

    // ── Special / secret ───────────────────────────────────────────────────

    case 'play_at_night': {
      const hour = new Date().getHours();
      return hour >= 20 || hour < 6;
    }

    default:
      return false;
  }
}

// ─── Check and unlock achievements ───────────────────────────────────────────

export function checkAchievements(gameState, triggerData) {
  initAchievements(gameState);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (gameState.achievements.unlocked[achievement.id]) continue;

    if (evaluateCondition(achievement.condition, gameState, triggerData)) {
      gameState.achievements.unlocked[achievement.id] = {
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(achievement.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveGameState(gameState);
  }

  return newlyUnlocked;
}

// ─── Accessors ───────────────────────────────────────────────────────────────

export function getAchievement(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

export function isUnlocked(gameState, id) {
  initAchievements(gameState);
  return !!gameState.achievements.unlocked[id];
}

export function getUnlockedCount(gameState) {
  initAchievements(gameState);
  return Object.keys(gameState.achievements.unlocked).length;
}

export function getTotalCount() {
  return ACHIEVEMENTS.length;
}

// Returns all achievements in a category, with an `unlocked` boolean attached.
export function getByCategory(gameState, category) {
  initAchievements(gameState);
  return ACHIEVEMENTS
    .filter(a => a.category === category)
    .map(a => ({
      ...a,
      unlocked: !!gameState.achievements.unlocked[a.id],
      unlockedAt: (gameState.achievements.unlocked[a.id] || {}).unlockedAt || null,
    }));
}
