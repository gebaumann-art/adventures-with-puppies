// AcademyUI.js — Main educational hub modal for Adventures With Puppies
// Screens: 1) Subject Picker  2) Topic Sub-Menu  3) Question Mode

import { addCoins } from '../systems/EconomySystem.js';
import { addXP }    from '../systems/DogSystem.js';
import { updateDogHUD } from '../ui/HUD.js';
import { playCoinClink } from '../ui/SoundFX.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTIONS_PER_SESSION = 5;

const SUBJECTS = [
  { id: 'math',          label: 'Math',          icon: '➕', color: '#FF6B6B', bg: '#FFF0F0', desc: 'Numbers, shapes & puzzles' },
  { id: 'reading',       label: 'Reading',        icon: '📖', color: '#4A90D9', bg: '#EEF5FF', desc: 'Stories & comprehension'  },
  { id: 'spelling',      label: 'Spelling',       icon: '🔤', color: '#9B59B6', bg: '#F5EEFF', desc: 'Words & patterns'         },
  { id: 'science',       label: 'Science',        icon: '🔬', color: '#27AE60', bg: '#EEFFEF', desc: 'Nature & discovery'       },
  { id: 'socialstudies', label: 'Social Studies', icon: '🌍', color: '#E67E22', bg: '#FFF5E8', desc: 'People, places & history' },
  { id: 'reportcard',   label: 'Report Card',    icon: '🏆', color: '#F1C40F', bg: '#FFFBEE', desc: 'See your progress!'        },
];

// ─── Module state ─────────────────────────────────────────────────────────────

let _overlay    = null;   // The full-page overlay div injected once
let _gameState  = null;
let _onClose    = null;

// Active question-session state
let _session = null;

// ─── CSS injection (runs once) ────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('academy-styles')) return;
  const style = document.createElement('style');
  style.id = 'academy-styles';
  style.textContent = `
    /* ── Overlay ──────────────────────────────────────────────────────────── */
    #academy-overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(30, 20, 60, 0.82);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: academy-fadein 0.22s ease;
      overflow-y: auto;
      padding: 16px;
      box-sizing: border-box;
    }
    #academy-overlay.hidden { display: none; }

    @keyframes academy-fadein {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Main panel ───────────────────────────────────────────────────────── */
    #academy-panel {
      background: #fff;
      border-radius: 28px;
      width: 100%;
      max-width: 740px;
      min-height: 520px;
      padding: 28px 30px 30px;
      box-shadow: 0 16px 60px rgba(0,0,0,0.45);
      position: relative;
      animation: academy-slidein 0.25s cubic-bezier(.3,1.4,.5,1);
      box-sizing: border-box;
    }
    @keyframes academy-slidein {
      from { transform: translateY(40px) scale(0.96); opacity: 0; }
      to   { transform: none; opacity: 1; }
    }

    /* ── Close button ─────────────────────────────────────────────────────── */
    #academy-close-btn {
      position: absolute;
      top: 16px;
      right: 18px;
      background: #f0f0f0;
      border: none;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      font-size: 20px;
      cursor: pointer;
      line-height: 38px;
      text-align: center;
      color: #555;
      transition: background 0.15s, transform 0.15s;
    }
    #academy-close-btn:hover { background: #e0e0e0; transform: scale(1.1); }

    /* ── Header ───────────────────────────────────────────────────────────── */
    .academy-header {
      text-align: center;
      margin-bottom: 18px;
    }
    .academy-header h1 {
      font-size: 2rem;
      font-weight: 900;
      margin: 0 0 4px;
      background: linear-gradient(135deg, #6B3FDB 0%, #E91E8C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
    .academy-header .mascot { font-size: 2.8rem; display: block; margin-bottom: 4px; }
    .academy-header .tagline {
      font-size: 0.88rem;
      color: #888;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── Streak & Daily Challenge banners ─────────────────────────────────── */
    .academy-streak-banner {
      background: linear-gradient(90deg, #FF8C00, #FF5252);
      color: #fff;
      border-radius: 12px;
      padding: 8px 16px;
      font-weight: 800;
      font-size: 1rem;
      text-align: center;
      margin-bottom: 12px;
      letter-spacing: 0.3px;
    }
    .academy-daily-banner {
      background: linear-gradient(90deg, #6B3FDB, #4A90D9);
      color: #fff;
      border-radius: 12px;
      padding: 10px 16px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .academy-daily-banner .daily-icon { font-size: 1.4rem; flex-shrink: 0; }
    .academy-daily-banner .daily-title { font-weight: 800; font-size: 0.95rem; }
    .academy-daily-banner .daily-desc  { font-size: 0.8rem; opacity: 0.9; }

    /* ── Subject grid ─────────────────────────────────────────────────────── */
    .academy-subject-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    @media (max-width: 500px) {
      .academy-subject-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .academy-subject-tile {
      border-radius: 18px;
      padding: 18px 10px 14px;
      text-align: center;
      cursor: pointer;
      border: 3px solid transparent;
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
      user-select: none;
      position: relative;
      overflow: hidden;
    }
    .academy-subject-tile:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 8px 28px rgba(0,0,0,0.16);
    }
    .academy-subject-tile:active { transform: scale(0.97); }
    .academy-subject-tile.report-card {
      border: 3px dashed #F1C40F;
    }
    .academy-subject-tile .subj-icon { font-size: 2.2rem; display: block; margin-bottom: 6px; }
    .academy-subject-tile .subj-name {
      font-weight: 800;
      font-size: 0.95rem;
      color: #222;
      display: block;
      margin-bottom: 3px;
    }
    .academy-subject-tile .subj-desc {
      font-size: 0.72rem;
      color: #666;
      display: block;
      margin-bottom: 8px;
    }
    .academy-subject-tile .subj-progress {
      font-size: 0.75rem;
      font-weight: 700;
      color: #888;
    }
    .subj-stars { color: #F1C40F; letter-spacing: 1px; }

    /* ── Back button ──────────────────────────────────────────────────────── */
    .academy-back-btn {
      background: #f0f0f0;
      border: none;
      border-radius: 10px;
      padding: 7px 16px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      color: #444;
      transition: background 0.15s;
      margin-bottom: 18px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .academy-back-btn:hover { background: #e0e0e0; }

    /* ── Subject header (in sub-menu) ─────────────────────────────────────── */
    .academy-subj-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .academy-subj-header .subj-big-icon { font-size: 2.4rem; }
    .academy-subj-header h2 {
      font-size: 1.5rem;
      font-weight: 900;
      margin: 0;
    }

    /* ── Topic grid ───────────────────────────────────────────────────────── */
    .academy-topic-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (max-width: 440px) {
      .academy-topic-grid { grid-template-columns: 1fr; }
    }

    .academy-topic-tile {
      border-radius: 14px;
      padding: 14px 16px;
      cursor: pointer;
      border: 2.5px solid transparent;
      transition: transform 0.14s, box-shadow 0.14s;
      display: flex;
      align-items: center;
      gap: 12px;
      user-select: none;
    }
    .academy-topic-tile:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 20px rgba(0,0,0,0.13);
    }
    .academy-topic-tile:active { transform: scale(0.97); }
    .academy-topic-tile .topic-icon { font-size: 1.6rem; flex-shrink: 0; }
    .academy-topic-tile .topic-info { flex: 1; min-width: 0; }
    .academy-topic-tile .topic-name { font-weight: 800; font-size: 0.9rem; color: #222; display: block; }
    .academy-topic-tile .topic-progress { font-size: 0.76rem; font-weight: 600; color: #666; display: block; margin-top: 2px; }
    .topic-mastered { color: #27AE60 !important; font-weight: 800 !important; }

    /* ── Reading passages list ────────────────────────────────────────────── */
    .academy-passage-list { display: flex; flex-direction: column; gap: 10px; }
    .academy-passage-tile {
      border-radius: 14px;
      padding: 14px 18px;
      cursor: pointer;
      border: 2.5px solid #ddd;
      background: #fafafa;
      transition: transform 0.14s, box-shadow 0.14s;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .academy-passage-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.1);
    }
    .academy-passage-tile .psg-icon { font-size: 1.5rem; flex-shrink: 0; }
    .academy-passage-tile .psg-title { font-weight: 800; font-size: 0.9rem; color: #222; }
    .academy-passage-tile .psg-meta  { font-size: 0.76rem; color: #888; margin-top: 2px; }
    .psg-done { color: #27AE60; font-weight: 800; }

    /* ── Question screen ──────────────────────────────────────────────────── */
    .academy-question-wrap { display: flex; flex-direction: column; gap: 0; }

    .acad-progress-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .acad-progress-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #888;
      white-space: nowrap;
    }
    .acad-progress-bar {
      flex: 1;
      height: 10px;
      background: #eee;
      border-radius: 10px;
      overflow: hidden;
    }
    .acad-progress-fill {
      height: 100%;
      border-radius: 10px;
      background: linear-gradient(90deg, #6B3FDB, #E91E8C);
      transition: width 0.35s ease;
    }
    .acad-streak-pip {
      font-size: 1rem;
      font-weight: 800;
      background: linear-gradient(90deg, #FF8C00, #FF5252);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
    }

    .acad-passage-box {
      background: #f8f6ff;
      border-left: 4px solid #6B3FDB;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 0.88rem;
      line-height: 1.7;
      color: #333;
      margin-bottom: 14px;
      max-height: 180px;
      overflow-y: auto;
      white-space: pre-line;
    }

    .acad-question-text {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.5;
      margin-bottom: 18px;
    }

    .acad-answers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 480px) { .acad-answers { grid-template-columns: 1fr; } }

    .acad-ans-btn {
      background: #f4f4f8;
      border: 2.5px solid #ddd;
      border-radius: 13px;
      padding: 12px 14px;
      font-size: 0.92rem;
      font-weight: 700;
      color: #333;
      cursor: pointer;
      text-align: left;
      transition: background 0.13s, border-color 0.13s, transform 0.12s;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.4;
    }
    .acad-ans-btn:hover:not(:disabled) {
      background: #ece8ff;
      border-color: #6B3FDB;
      transform: scale(1.02);
    }
    .acad-ans-btn .ans-label {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #6B3FDB;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 900;
      text-align: center;
      line-height: 22px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .acad-ans-btn.correct {
      background: #d4f7e0;
      border-color: #27AE60;
      color: #155724;
    }
    .acad-ans-btn.correct .ans-label { background: #27AE60; }
    .acad-ans-btn.wrong {
      background: #fde8e8;
      border-color: #E74C3C;
      color: #7b1919;
    }
    .acad-ans-btn.wrong .ans-label { background: #E74C3C; }

    .acad-feedback {
      background: #f8f6ff;
      border-radius: 13px;
      padding: 14px 18px;
      margin-bottom: 14px;
      font-size: 0.88rem;
      line-height: 1.6;
      color: #333;
      border-left: 4px solid #6B3FDB;
      display: none;
    }
    .acad-feedback.visible { display: block; }
    .acad-feedback.correct-fb { border-color: #27AE60; background: #efffee; }
    .acad-feedback.wrong-fb   { border-color: #E74C3C; background: #fff4f4; }
    .acad-feedback .fb-result { font-size: 1rem; font-weight: 900; margin-bottom: 6px; }
    .acad-feedback .fb-expl   { color: #444; }
    .acad-feedback .fb-fact   { color: #6B3FDB; font-weight: 600; margin-top: 8px; font-size: 0.82rem; }

    .acad-next-btn {
      background: linear-gradient(135deg, #6B3FDB, #E91E8C);
      color: #fff;
      border: none;
      border-radius: 13px;
      padding: 13px 28px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.15s, transform 0.12s;
      letter-spacing: 0.3px;
      display: none;
    }
    .acad-next-btn:hover { opacity: 0.9; transform: scale(1.02); }
    .acad-next-btn.visible { display: block; }

    /* ── Results screen ───────────────────────────────────────────────────── */
    .acad-results {
      text-align: center;
      padding: 10px 0 6px;
    }
    .acad-results .res-title {
      font-size: 1.8rem;
      font-weight: 900;
      margin-bottom: 6px;
    }
    .acad-results .res-stars {
      font-size: 2rem;
      letter-spacing: 4px;
      margin-bottom: 14px;
    }
    .acad-results .res-row {
      display: flex;
      justify-content: center;
      gap: 22px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .acad-results .res-stat {
      background: #f4f4f8;
      border-radius: 14px;
      padding: 12px 20px;
      min-width: 90px;
    }
    .acad-results .res-stat .rs-num { font-size: 1.6rem; font-weight: 900; color: #6B3FDB; }
    .acad-results .res-stat .rs-lbl { font-size: 0.76rem; color: #888; font-weight: 700; margin-top: 2px; }
    .acad-results .res-msg { font-size: 1rem; color: #555; margin-bottom: 20px; font-weight: 600; }

    .acad-results .res-back-btn {
      background: linear-gradient(135deg, #6B3FDB, #E91E8C);
      color: #fff;
      border: none;
      border-radius: 13px;
      padding: 13px 32px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.12s;
    }
    .acad-results .res-back-btn:hover { opacity: 0.9; transform: scale(1.02); }

    /* ── Report Card ──────────────────────────────────────────────────────── */
    .acad-report-card { padding: 4px 0; }
    .acad-report-card h2 { font-size: 1.4rem; font-weight: 900; margin-bottom: 16px; text-align: center; }
    .rc-subject-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 13px;
      margin-bottom: 10px;
    }
    .rc-subject-row .rc-icon { font-size: 1.6rem; }
    .rc-subject-row .rc-name { font-weight: 800; font-size: 0.95rem; flex: 1; }
    .rc-subject-row .rc-bar-wrap { flex: 2; background: #eee; border-radius: 8px; height: 10px; overflow: hidden; }
    .rc-subject-row .rc-bar { height: 100%; border-radius: 8px; transition: width 0.5s ease; }
    .rc-subject-row .rc-pct { font-weight: 800; font-size: 0.9rem; min-width: 36px; text-align: right; }
    .rc-total {
      text-align: center;
      margin-top: 18px;
      font-size: 1.1rem;
      font-weight: 800;
      color: #555;
    }
    .rc-total span { color: #6B3FDB; font-size: 1.4rem; }
  `;
  document.head.appendChild(style);
}

// ─── Overlay bootstrap (once per page load) ───────────────────────────────────

function getOrCreateOverlay() {
  if (_overlay) return _overlay;
  injectStyles();
  _overlay = document.createElement('div');
  _overlay.id = 'academy-overlay';
  _overlay.classList.add('hidden');
  _overlay.innerHTML = `
    <div id="academy-panel">
      <button id="academy-close-btn" title="Close Academy">✕</button>
      <div id="academy-content"></div>
    </div>
  `;
  document.body.appendChild(_overlay);
  document.getElementById('academy-close-btn').addEventListener('click', closeAcademy);
  return _overlay;
}

function getContent() {
  return document.getElementById('academy-content');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function openAcademy(gameState, onClose) {
  _gameState = gameState;
  _onClose   = onClose || null;

  const overlay = getOrCreateOverlay();
  overlay.classList.remove('hidden');
  renderSubjectPicker();
}

export function closeAcademy() {
  if (_overlay) _overlay.classList.add('hidden');
  _session = null;
  if (_onClose) {
    _onClose();
    _onClose = null;
  }
}

// Open a specific subject + topic directly (can be called from outside too)
export function openAcademySubject(gameState, subject, topicId, questions, onClose) {
  _gameState = gameState;
  _onClose   = onClose || null;

  const overlay = getOrCreateOverlay();
  overlay.classList.remove('hidden');
  startQuestionSession(subject, topicId, questions);
}

// ─── Screen 1 — Subject Picker ────────────────────────────────────────────────

function renderSubjectPicker() {
  const gs = _gameState;
  const streak = gs.academyStreak || 0;
  const daily  = getActiveDaily(gs);

  const content = getContent();
  content.innerHTML = `
    ${streak >= 3 ? `<div class="academy-streak-banner">🔥 ${streak} in a row! Keep it up!</div>` : ''}
    ${daily ? renderDailyBanner(daily) : ''}
    <div class="academy-header">
      <span class="mascot">🐶</span>
      <h1>🏫 Puppy Academy</h1>
      <span class="tagline">Learn, Earn, Explore!</span>
    </div>
    <div class="academy-subject-grid">
      ${SUBJECTS.map(s => renderSubjectTile(s, gs)).join('')}
    </div>
  `;

  // Wire up tile clicks
  SUBJECTS.forEach(s => {
    const tile = content.querySelector(`[data-subj="${s.id}"]`);
    if (tile) tile.addEventListener('click', () => handleSubjectClick(s.id));
  });
}

function renderSubjectTile(s, gs) {
  const progress = getSubjectProgress(s.id, gs);
  const isReport = s.id === 'reportcard';
  return `
    <div class="academy-subject-tile ${isReport ? 'report-card' : ''}"
         data-subj="${s.id}"
         style="background:${s.bg}; border-color:${s.color}40;">
      <span class="subj-icon">${s.icon}</span>
      <span class="subj-name">${s.label}</span>
      <span class="subj-desc">${s.desc}</span>
      <span class="subj-progress">${progress}</span>
    </div>
  `;
}

function renderDailyBanner(daily) {
  return `
    <div class="academy-daily-banner">
      <span class="daily-icon">${daily.icon}</span>
      <div>
        <div class="daily-title">Daily Challenge: ${daily.title}</div>
        <div class="daily-desc">${daily.description}</div>
      </div>
    </div>
  `;
}

function getActiveDaily(gs) {
  try {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (gs.dailyChallenge && gs.dailyChallenge.date === todayKey && !gs.dailyChallenge.completed) {
      return gs.dailyChallenge;
    }
  } catch (_) {}
  return null;
}

function getSubjectProgress(subjectId, gs) {
  const acad = gs.academy || {};
  switch (subjectId) {
    case 'math': {
      const stars = acad.mathStars || 0;
      const filled = '⭐'.repeat(Math.min(stars, 3));
      const empty  = '☆'.repeat(Math.max(0, 3 - stars));
      return `<span class="subj-stars">${filled}${empty}</span>`;
    }
    case 'reading': {
      const done = (acad.passagesDone || []).length;
      return `${done} passage${done !== 1 ? 's' : ''} read`;
    }
    case 'spelling': {
      const mastered = acad.spellingMastered || 0;
      return `${mastered} word${mastered !== 1 ? 's' : ''} mastered`;
    }
    case 'science': {
      const explored = (acad.scienceTopics || []).length;
      return `${explored} topic${explored !== 1 ? 's' : ''} explored`;
    }
    case 'socialstudies': {
      const explored = (acad.ssTopics || []).length;
      return `${explored} topic${explored !== 1 ? 's' : ''} explored`;
    }
    case 'reportcard': {
      const total = acad.totalCorrect || 0;
      return `${total} correct total`;
    }
    default: return '';
  }
}

function handleSubjectClick(subjectId) {
  if (subjectId === 'reportcard') {
    renderReportCard();
    return;
  }
  renderTopicPicker(subjectId);
}

// ─── Screen 2 — Topic / Passage Picker ───────────────────────────────────────

async function renderTopicPicker(subjectId) {
  const content = getContent();

  // Show a loading state while we dynamically import
  content.innerHTML = `
    <button class="academy-back-btn" id="acad-back-to-subjects">← Back</button>
    <div style="text-align:center;padding:40px;color:#aaa;font-size:1.1rem;">Loading…</div>
  `;
  content.querySelector('#acad-back-to-subjects').addEventListener('click', renderSubjectPicker);

  try {
    if (subjectId === 'reading') {
      const { READING_PASSAGES, READING_SKILLS } = await import('../data/readingPassages.js');
      renderReadingPicker(READING_PASSAGES, READING_SKILLS);
    } else if (subjectId === 'spelling') {
      const { SPELLING_LISTS } = await import('../data/spellingWords.js');
      renderSpellingPicker(SPELLING_LISTS);
    } else if (subjectId === 'math') {
      const { MATH_TOPICS, MATH_QUESTIONS } = await import('../data/mathQuestions.js');
      renderGenericTopicPicker(subjectId, MATH_TOPICS, MATH_QUESTIONS, 'topic');
    } else if (subjectId === 'science') {
      const { SCIENCE_TOPICS, SCIENCE_QUESTIONS } = await import('../data/scienceQuestions.js');
      renderGenericTopicPicker(subjectId, SCIENCE_TOPICS, SCIENCE_QUESTIONS, 'topic');
    } else if (subjectId === 'socialstudies') {
      const { SS_TOPICS, SS_QUESTIONS } = await import('../data/socialStudiesQuestions.js');
      renderGenericTopicPicker(subjectId, SS_TOPICS, SS_QUESTIONS, 'topic');
    }
  } catch (err) {
    content.innerHTML += `<p style="color:red;padding:20px;">Couldn't load data: ${err.message}</p>`;
  }
}

function renderGenericTopicPicker(subjectId, topics, questions, topicKey) {
  const gs = _gameState;
  const acad = gs.academy || {};
  const correctMap = acad.correctByTopic || {};
  const content = getContent();
  const subject = SUBJECTS.find(s => s.id === subjectId);

  content.innerHTML = `
    <button class="academy-back-btn" id="acad-back-to-subjects">← Back</button>
    <div class="academy-subj-header">
      <span class="subj-big-icon">${subject.icon}</span>
      <h2 style="color:${subject.color}">${subject.label}</h2>
    </div>
    <div class="academy-topic-grid">
      ${topics.map(t => {
        const correct = correctMap[t.id] || 0;
        const mastered = correct >= 10;
        return `
          <div class="academy-topic-tile"
               data-topic="${t.id}"
               style="background:${t.color}18; border-color:${t.color}55;">
            <span class="topic-icon">${t.icon}</span>
            <div class="topic-info">
              <span class="topic-name">${t.label.replace(/^[^ ]+ /, '')}</span>
              <span class="topic-progress ${mastered ? 'topic-mastered' : ''}">
                ${mastered ? 'Mastered ✓' : `${correct}/10 correct`}
              </span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  content.querySelector('#acad-back-to-subjects').addEventListener('click', renderSubjectPicker);

  topics.forEach(t => {
    const tile = content.querySelector(`[data-topic="${t.id}"]`);
    if (tile) tile.addEventListener('click', () => {
      const topicQs = questions.filter(q => q[topicKey] === t.id);
      startQuestionSession(subjectId, t.id, topicQs);
    });
  });
}

function renderReadingPicker(passages, skills) {
  const gs = _gameState;
  const donePassages = (gs.academy || {}).passagesDone || [];
  const content = getContent();

  content.innerHTML = `
    <button class="academy-back-btn" id="acad-back-to-subjects">← Back</button>
    <div class="academy-subj-header">
      <span class="subj-big-icon">📖</span>
      <h2 style="color:#4A90D9">Reading</h2>
    </div>
    <div class="academy-passage-list">
      ${passages.map(p => {
        const done = donePassages.includes(p.id);
        const genreIcon = p.genre === 'fiction' ? '📚' : '🔭';
        return `
          <div class="academy-passage-tile" data-passage="${p.id}">
            <span class="psg-icon">${genreIcon}</span>
            <div>
              <div class="psg-title">${p.title}</div>
              <div class="psg-meta">
                ${p.genre} · Lexile ${p.lexileLevel}
                ${done ? '<span class="psg-done"> · Completed ✓</span>' : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  content.querySelector('#acad-back-to-subjects').addEventListener('click', renderSubjectPicker);

  passages.forEach(p => {
    const tile = content.querySelector(`[data-passage="${p.id}"]`);
    if (tile) tile.addEventListener('click', () => {
      startReadingSession(p);
    });
  });
}

function renderSpellingPicker(lists) {
  const gs = _gameState;
  const masteredLists = (gs.academy || {}).spellingListsMastered || [];
  const content = getContent();

  content.innerHTML = `
    <button class="academy-back-btn" id="acad-back-to-subjects">← Back</button>
    <div class="academy-subj-header">
      <span class="subj-big-icon">🔤</span>
      <h2 style="color:#9B59B6">Spelling</h2>
    </div>
    <div class="academy-topic-grid">
      ${lists.map(list => {
        const mastered = masteredLists.includes(list.id);
        return `
          <div class="academy-topic-tile" data-spelllist="${list.id}"
               style="background:#f5eeff; border-color:#9B59B655;">
            <span class="topic-icon">🔤</span>
            <div class="topic-info">
              <span class="topic-name">${list.name}</span>
              <span class="topic-progress" style="font-size:0.7rem;color:#aaa">${list.pattern}</span>
              <span class="topic-progress ${mastered ? 'topic-mastered' : ''}">
                ${mastered ? 'Mastered ✓' : `${list.words.length} words`}
              </span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  content.querySelector('#acad-back-to-subjects').addEventListener('click', renderSubjectPicker);

  lists.forEach(list => {
    const tile = content.querySelector(`[data-spelllist="${list.id}"]`);
    if (tile) tile.addEventListener('click', () => {
      const spellingQs = buildSpellingQuestions(list);
      startQuestionSession('spelling', list.id, spellingQs);
    });
  });
}

// Convert a spelling word list into multiple-choice questions
function buildSpellingQuestions(list) {
  const allWords = list.words.slice();
  const questions = [];
  const usedWords = new Set();

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];
    if (usedWords.has(word)) continue;
    usedWords.add(word);

    // Create a simple "Which is spelled correctly?" question
    const misspellings = makeMisspellings(word);
    const options = shuffleArray([word, ...misspellings.slice(0, 3)]);
    const answerIdx = options.indexOf(word);

    questions.push({
      id: `spell_${list.id}_${i}`,
      topic: list.id,
      question: `Which one is spelled correctly?`,
      hint: `Think about the pattern: ${list.pattern}`,
      options,
      answer: answerIdx,
      explanation: `"${word}" is the correct spelling. Pattern: ${list.pattern}.`,
      funFact: null,
      coins: 2,
    });
  }
  return questions;
}

function makeMisspellings(word) {
  const variants = [];
  if (word.length > 3) {
    // swap two adjacent letters
    const arr = word.split('');
    const i = Math.floor(word.length / 2);
    [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
    variants.push(arr.join(''));
    // double a letter
    variants.push(word.slice(0, i) + word[i] + word.slice(i));
    // drop a letter
    variants.push(word.slice(0, i - 1) + word.slice(i));
  } else {
    variants.push(word + 'e', word + 's', word.slice(0, -1) + 'ing');
  }
  // Ensure we always return 3 unique variants different from the word
  return [...new Set(variants.filter(v => v !== word))].slice(0, 3);
}

// ─── Screen 3 — Question Mode ─────────────────────────────────────────────────

function startQuestionSession(subjectId, topicId, allQuestions) {
  const questions = pickQuestions(allQuestions, QUESTIONS_PER_SESSION);
  _session = {
    subjectId,
    topicId,
    questions,
    currentIdx: 0,
    correct: 0,
    streak: _gameState.academyStreak || 0,
    coinsEarned: 0,
    xpEarned: 0,
    answered: false,
  };
  renderQuestion();
}

function startReadingSession(passage) {
  _session = {
    subjectId: 'reading',
    topicId: passage.id,
    passageText: passage.passage,
    questions: pickQuestions(passage.questions, QUESTIONS_PER_SESSION),
    currentIdx: 0,
    correct: 0,
    streak: _gameState.academyStreak || 0,
    coinsEarned: 0,
    xpEarned: 0,
    answered: false,
  };
  renderQuestion();
}

function renderQuestion() {
  const s = _session;
  if (!s) return;
  const q = s.questions[s.currentIdx];
  const total = s.questions.length;
  const qNum  = s.currentIdx + 1;
  const pct   = Math.round(((qNum - 1) / total) * 100);
  const LABELS = ['A', 'B', 'C', 'D'];

  const content = getContent();
  content.innerHTML = `
    <div class="academy-question-wrap">
      <div class="acad-progress-row">
        <span class="acad-progress-label">Question ${qNum} of ${total}</span>
        <div class="acad-progress-bar">
          <div class="acad-progress-fill" style="width:${pct}%"></div>
        </div>
        ${s.streak >= 3 ? `<span class="acad-streak-pip">🔥 ${s.streak}</span>` : ''}
      </div>

      ${s.passageText ? `<div class="acad-passage-box">${escapeHtml(s.passageText)}</div>` : ''}

      <div class="acad-question-text">${q.question}</div>

      <div class="acad-answers" id="acad-answers">
        ${q.options.map((opt, i) => `
          <button class="acad-ans-btn" data-idx="${i}">
            <span class="ans-label">${LABELS[i] || i + 1}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>

      <div class="acad-feedback" id="acad-feedback"></div>

      <button class="acad-next-btn" id="acad-next-btn">
        ${qNum < total ? 'Next Question →' : 'See Results!'}
      </button>
    </div>
  `;

  s.answered = false;

  // Wire answer buttons
  const answerBtns = content.querySelectorAll('.acad-ans-btn');
  answerBtns.forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.idx, 10)));
  });

  // Wire next button
  const nextBtn = content.querySelector('#acad-next-btn');
  nextBtn.addEventListener('click', advanceQuestion);

  // Animate progress bar fill after paint
  requestAnimationFrame(() => {
    const fill = content.querySelector('.acad-progress-fill');
    if (fill) fill.style.width = pct + '%';
  });
}

function handleAnswer(idx) {
  const s = _session;
  if (!s || s.answered) return;
  s.answered = true;

  const q = s.questions[s.currentIdx];
  const isCorrect = idx === q.answer;

  const content = getContent();
  const answerBtns = content.querySelectorAll('.acad-ans-btn');
  const feedbackEl = content.querySelector('#acad-feedback');
  const nextBtn    = content.querySelector('#acad-next-btn');

  // Disable all buttons
  answerBtns.forEach(btn => btn.disabled = true);

  // Highlight correct / wrong
  answerBtns.forEach((btn, i) => {
    if (i === q.answer) btn.classList.add('correct');
    else if (i === idx)  btn.classList.add('wrong');
  });

  // Update streak & rewards
  if (isCorrect) {
    s.correct++;
    s.streak++;
    const coins = q.coins || 2;
    const xp    = 10 + (s.streak >= 3 ? 5 : 0); // bonus XP for streaks
    s.coinsEarned += coins;
    s.xpEarned    += xp;
    addCoins(_gameState, coins);
    playCoinClink();
    if (_gameState.currentDog) {
      addXP(_gameState.currentDog, xp);
      updateDogHUD(_gameState);
    }
    feedbackEl.className = 'acad-feedback correct-fb visible';
    feedbackEl.innerHTML = `
      <div class="fb-result">✅ Correct! +${coins} coins · +${xp} XP${s.streak >= 3 ? ` · 🔥 Streak: ${s.streak}` : ''}</div>
      <div class="fb-expl">${q.explanation || ''}</div>
      ${q.funFact ? `<div class="fb-fact">🐶 Fun fact: ${q.funFact}</div>` : ''}
    `;
  } else {
    s.streak = 0;
    feedbackEl.className = 'acad-feedback wrong-fb visible';
    feedbackEl.innerHTML = `
      <div class="fb-result">❌ Not quite!</div>
      <div class="fb-expl">${q.explanation || 'The correct answer has been highlighted above.'}</div>
      ${q.funFact ? `<div class="fb-fact">🐶 Fun fact: ${q.funFact}</div>` : ''}
    `;
  }

  nextBtn.classList.add('visible');
  saveAcademyProgress();
}

function advanceQuestion() {
  const s = _session;
  if (!s) return;
  s.currentIdx++;
  if (s.currentIdx >= s.questions.length) {
    renderResults();
  } else {
    renderQuestion();
  }
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function renderResults() {
  const s = _session;
  const total   = s.questions.length;
  const correct = s.correct;
  const pct     = Math.round((correct / total) * 100);

  // Star rating: 1-3
  let stars = 1;
  if (pct >= 60) stars = 2;
  if (pct >= 90) stars = 3;
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  const msgs = [
    'Keep practicing — you can do it!',
    'Good effort! Try again to get more stars!',
    'Great work! You nailed it! 🎉',
  ];
  const msg = msgs[stars - 1];

  const content = getContent();
  content.innerHTML = `
    <div class="acad-results">
      <div class="res-title">Session Complete!</div>
      <div class="res-stars">${starStr}</div>
      <div class="res-row">
        <div class="res-stat">
          <div class="rs-num">${correct}/${total}</div>
          <div class="rs-lbl">Correct</div>
        </div>
        <div class="res-stat">
          <div class="rs-num" style="color:#F1C40F">+${s.coinsEarned}</div>
          <div class="rs-lbl">Coins</div>
        </div>
        <div class="res-stat">
          <div class="rs-num" style="color:#27AE60">+${s.xpEarned}</div>
          <div class="rs-lbl">XP</div>
        </div>
      </div>
      <div class="res-msg">${msg}</div>
      <button class="res-back-btn" id="acad-back-from-results">Back to Academy</button>
    </div>
  `;

  content.querySelector('#acad-back-from-results').addEventListener('click', () => {
    _session = null;
    renderSubjectPicker();
  });

  // Update best stars for math
  if (s.subjectId === 'math') {
    const acad = (_gameState.academy = _gameState.academy || {});
    acad.mathStars = Math.max(acad.mathStars || 0, stars);
  }

  saveAcademyProgress();
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function renderReportCard() {
  const gs = _gameState;
  const acad = gs.academy || {};
  const correctMap = acad.correctByTopic || {};

  const subjectStats = [
    { id: 'math',          icon: '➕', label: 'Math',          color: '#FF6B6B', max: 80 },
    { id: 'reading',       icon: '📖', label: 'Reading',        color: '#4A90D9', max: 30 },
    { id: 'spelling',      icon: '🔤', label: 'Spelling',       color: '#9B59B6', max: 60 },
    { id: 'science',       icon: '🔬', label: 'Science',        color: '#27AE60', max: 80 },
    { id: 'socialstudies', icon: '🌍', label: 'Social Studies', color: '#E67E22', max: 80 },
  ];

  const totalCorrect = acad.totalCorrect || 0;

  const content = getContent();
  content.innerHTML = `
    <button class="academy-back-btn" id="acad-back-to-subjects">← Back</button>
    <div class="acad-report-card">
      <h2>🏆 Report Card</h2>
      ${subjectStats.map(s => {
        const score = acad[`${s.id}Correct`] || 0;
        const pct   = Math.min(100, Math.round((score / s.max) * 100));
        return `
          <div class="rc-subject-row" style="background:${s.color}18">
            <span class="rc-icon">${s.icon}</span>
            <span class="rc-name">${s.label}</span>
            <div class="rc-bar-wrap">
              <div class="rc-bar" style="width:${pct}%; background:${s.color}"></div>
            </div>
            <span class="rc-pct" style="color:${s.color}">${pct}%</span>
          </div>
        `;
      }).join('')}
      <div class="rc-total">Total correct answers: <span>${totalCorrect}</span></div>
    </div>
  `;

  content.querySelector('#acad-back-to-subjects').addEventListener('click', renderSubjectPicker);

  // Animate bars after paint
  requestAnimationFrame(() => {
    content.querySelectorAll('.rc-bar').forEach(bar => {
      const target = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.width = target; });
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickQuestions(all, count) {
  if (!all || all.length === 0) return [];
  const shuffled = shuffleArray([...all]);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function saveAcademyProgress() {
  const s = _session;
  const gs = _gameState;
  if (!gs) return;

  const acad = (gs.academy = gs.academy || {});

  // Update streak
  gs.academyStreak = s ? s.streak : (gs.academyStreak || 0);

  // Update per-topic correct counts
  if (s && s.topicId) {
    acad.correctByTopic = acad.correctByTopic || {};
    acad.correctByTopic[s.topicId] = (acad.correctByTopic[s.topicId] || 0) + s.correct;
  }

  // Update subject-level correct totals
  if (s) {
    const subjectKey = `${s.subjectId}Correct`;
    acad[subjectKey] = (acad[subjectKey] || 0) + s.correct;
    acad.totalCorrect = (acad.totalCorrect || 0) + s.correct;

    // Track reading passages done
    if (s.subjectId === 'reading' && s.topicId && s.correct > 0) {
      acad.passagesDone = acad.passagesDone || [];
      if (!acad.passagesDone.includes(s.topicId)) acad.passagesDone.push(s.topicId);
    }

    // Track science/ss topics explored
    if (s.subjectId === 'science') {
      acad.scienceTopics = acad.scienceTopics || [];
      if (!acad.scienceTopics.includes(s.topicId)) acad.scienceTopics.push(s.topicId);
    }
    if (s.subjectId === 'socialstudies') {
      acad.ssTopics = acad.ssTopics || [];
      if (!acad.ssTopics.includes(s.topicId)) acad.ssTopics.push(s.topicId);
    }

    // Spelling mastered words tally
    if (s.subjectId === 'spelling') {
      acad.spellingMastered = (acad.spellingMastered || 0) + s.correct;
      acad.spellingListsMastered = acad.spellingListsMastered || [];
      if (s.correct >= QUESTIONS_PER_SESSION && !acad.spellingListsMastered.includes(s.topicId)) {
        acad.spellingListsMastered.push(s.topicId);
      }
    }
  }

  try {
    localStorage.setItem('awp3d_gamestate', JSON.stringify(gs));
  } catch (_) {}
}
