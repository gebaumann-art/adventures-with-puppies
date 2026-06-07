// Adventures With Puppies — Academy System
// Tracks per-subject progress, streaks, and daily challenges in the Puppy Academy.

import { DAILY_CHALLENGE_POOL } from '../data/dailyChallenges.js';

// ─── Subject metadata ────────────────────────────────────────────────────────

const SUBJECTS = [
  { key: 'math',          label: 'Math',          icon: '➕' },
  { key: 'reading',       label: 'Reading',        icon: '📖' },
  { key: 'spelling',      label: 'Spelling',       icon: '✏️' },
  { key: 'science',       label: 'Science',        icon: '🔬' },
  { key: 'social_studies',label: 'Social Studies', icon: '🌍' },
];

// Stars are awarded per subject based on accuracy percentage:
//   0 stars: < 50%
//   1 star : 50–69%
//   2 stars: 70–89%
//   3 stars: ≥ 90%
function calcStars(correct, total) {
  if (!total) return 0;
  const pct = correct / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.5) return 1;
  return 0;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveGameState(gameState) {
  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gameState));
  } catch (_) {}
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initAcademy(gameState) {
  if (!gameState.academy) {
    gameState.academy = {};
  }

  // Ensure every subject has a progress entry
  for (const { key } of SUBJECTS) {
    if (!gameState.academy[key]) {
      gameState.academy[key] = {
        questionsAnswered: 0,
        questionsCorrect:  0,
        topicsCompleted:   [],
        topicCorrectCounts:{},   // { [topic]: count }
        lastPlayed:        null,
      };
    }
  }

  // Streak tracking at the top level of academy
  if (typeof gameState.academy.streak === 'undefined') {
    gameState.academy.streak = 0;
  }

  // Daily challenge tracking
  if (!gameState.academy.dailyChallenge) {
    gameState.academy.dailyChallenge = {
      completedIds: [],         // all-time completed challenge IDs
      lastCompleteDate: null,   // 'YYYY-MM-DD' of last completion
      streakDays: 0,            // consecutive days completed
    };
  }

  return gameState;
}

// ─── Subject progress ────────────────────────────────────────────────────────

export function getSubjectProgress(gameState, subject) {
  initAcademy(gameState);
  const s = gameState.academy[subject];
  if (!s) {
    return {
      questionsAnswered: 0,
      questionsCorrect:  0,
      topicsCompleted:   [],
      lastPlayed:        null,
      stars:             0,
    };
  }
  return {
    questionsAnswered: s.questionsAnswered,
    questionsCorrect:  s.questionsCorrect,
    topicsCompleted:   [...(s.topicsCompleted || [])],
    lastPlayed:        s.lastPlayed,
    stars:             calcStars(s.questionsCorrect, s.questionsAnswered),
  };
}

// ─── Record an answer ────────────────────────────────────────────────────────

export function recordAnswer(gameState, subject, topic, correct, coins) {
  initAcademy(gameState);

  const s = gameState.academy[subject];
  if (!s) return gameState;

  s.questionsAnswered += 1;
  if (correct) s.questionsCorrect += 1;
  s.lastPlayed = new Date().toISOString();

  // Per-topic correct count (used for mastery)
  if (!s.topicCorrectCounts) s.topicCorrectCounts = {};
  if (!s.topicCorrectCounts[topic]) s.topicCorrectCounts[topic] = 0;
  if (correct) s.topicCorrectCounts[topic] += 1;

  // Mark topic completed if mastered (and not already listed)
  if (isTopicMastered(gameState, subject, topic)) {
    if (!s.topicsCompleted.includes(topic)) {
      s.topicsCompleted.push(topic);
    }
  }

  // Update streak
  updateStreak(gameState, correct);

  // Optionally record coin reward (coins param is informational — caller grants them)
  // No-op here; EconomySystem.addCoins() is the source of truth for coins.

  saveGameState(gameState);
  return gameState;
}

// ─── Report card ─────────────────────────────────────────────────────────────

export function getReportCardData(gameState) {
  initAcademy(gameState);
  return SUBJECTS.map(({ key, label, icon }) => {
    const s = gameState.academy[key] || {};
    const correct = s.questionsCorrect  || 0;
    const total   = s.questionsAnswered || 0;
    const pct     = total ? Math.round((correct / total) * 100) : 0;
    return {
      subject: key,
      label,
      icon,
      correct,
      total,
      pct,
      stars: calcStars(correct, total),
    };
  });
}

// ─── Topic mastery ───────────────────────────────────────────────────────────

// A topic is mastered when the player has answered ≥ 8 questions correctly in it.
export function isTopicMastered(gameState, subject, topic) {
  initAcademy(gameState);
  const s = gameState.academy[subject];
  if (!s || !s.topicCorrectCounts) return false;
  return (s.topicCorrectCounts[topic] || 0) >= 8;
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export function getStreakCount(gameState) {
  initAcademy(gameState);
  return gameState.academy.streak || 0;
}

export function updateStreak(gameState, correct) {
  initAcademy(gameState);
  if (correct) {
    gameState.academy.streak = (gameState.academy.streak || 0) + 1;
  } else {
    gameState.academy.streak = 0;
  }
  return gameState.academy.streak;
}

// ─── Daily challenge ─────────────────────────────────────────────────────────

// Returns today's date string as 'YYYY-MM-DD' using local time.
function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Deterministic index from a date string into the pool.
function dateToIndex(dateStr, poolLength) {
  // Sum the numeric digits of YYYYMMDD for a simple, stable hash.
  const digits = dateStr.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < digits.length; i++) {
    hash = (hash * 31 + Number(digits[i])) >>> 0;
  }
  return hash % poolLength;
}

export function getDailyChallenge(gameState) {
  const today = todayString();
  const index = dateToIndex(today, DAILY_CHALLENGE_POOL.length);
  return { ...DAILY_CHALLENGE_POOL[index], _date: today };
}

export function completeDailyChallenge(gameState, challengeId) {
  initAcademy(gameState);
  const dc   = gameState.academy.dailyChallenge;
  const today = todayString();

  if (!dc.completedIds.includes(challengeId)) {
    dc.completedIds.push(challengeId);
  }

  // Daily challenge streak logic
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  if (dc.lastCompleteDate === yesterday) {
    dc.streakDays = (dc.streakDays || 0) + 1;
  } else if (dc.lastCompleteDate !== today) {
    dc.streakDays = 1;
  }
  // If lastCompleteDate === today, the streak doesn't change (already counted today)

  dc.lastCompleteDate = today;

  saveGameState(gameState);
  return gameState;
}

export function isDailyChallengeComplete(gameState) {
  initAcademy(gameState);
  const challenge = getDailyChallenge(gameState);
  const dc = gameState.academy.dailyChallenge;
  return dc.completedIds.includes(challenge.id);
}
