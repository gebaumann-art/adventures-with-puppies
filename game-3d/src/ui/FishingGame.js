// FishingGame.js — Canvas-based Fishing Mini-Game
// Adventures With Puppies — children's dog game
// No external assets required

const FISH_TYPES = [
  { id: 'common',   label: 'Smallfin',      color: '#5bc8ff', fin: '#3a9fd8', belly: '#c8eeff', bones: 1, xp: 3,  w: 42, h: 22, speed: 90,  biteWindow: 0.9,  prob: 0.50 },
  { id: 'tropical', label: 'Tropicfin',     color: '#ff8c2a', fin: '#cc5500', belly: '#ffe0b0', bones: 2, xp: 6,  w: 34, h: 20, speed: 120, biteWindow: 0.75, prob: 0.30 },
  { id: 'deep',     label: 'Deepglider',    color: '#3355bb', fin: '#1a2e88', belly: '#8899ee', bones: 3, xp: 10, w: 52, h: 28, speed: 150, biteWindow: 0.60, prob: 0.15 },
  { id: 'golden',   label: '⭐ Goldscale',  color: '#ffd700', fin: '#e6a000', belly: '#fff0a0', bones: 5, xp: 20, w: 30, h: 17, speed: 180, biteWindow: 0.45, prob: 0.05 },
];

const TOTAL_CASTS = 4;
const HOOK_DESCENT_DURATION = 2500; // ms (ease-out)
const BITE_PROXIMITY = 45;          // px
const CAUGHT_DURATION = 1800;       // ms
const MISSED_DURATION = 1400;       // ms
const RESPAWN_DELAY = 1200;         // ms after fish escapes

// ─── Fish random selection ────────────────────────────────────────────────────
function pickFishType() {
  const r = Math.random();
  let acc = 0;
  for (const ft of FISH_TYPES) {
    acc += ft.prob;
    if (r < acc) return ft;
  }
  return FISH_TYPES[0];
}

// ─── Draw a fish on the canvas ────────────────────────────────────────────────
function drawFish(ctx, fish, x, y, facingLeft) {
  const { w, h, color, fin, belly } = fish.type;
  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) ctx.scale(-1, 1);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Belly highlight
  ctx.beginPath();
  ctx.ellipse(0, h * 0.12, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = belly;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Tail
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(-w / 2 - w * 0.32, -h * 0.55);
  ctx.lineTo(-w / 2 - w * 0.32,  h * 0.55);
  ctx.closePath();
  ctx.fillStyle = fin;
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -h / 2);
  ctx.quadraticCurveTo(w * 0.08, -h * 0.9, w * 0.2, -h / 2);
  ctx.fillStyle = fin;
  ctx.fill();

  // Eye (white + pupil)
  const eyeX = w * 0.28;
  const eyeY = -h * 0.1;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, h * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX + h * 0.05, eyeY, h * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  ctx.restore();
}

// ─── Draw J-shaped hook ───────────────────────────────────────────────────────
function drawHook(ctx, x, y, jiggle) {
  const hx = x + jiggle;
  ctx.save();
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  // Shank
  ctx.beginPath();
  ctx.moveTo(hx, y - 14);
  ctx.lineTo(hx, y + 6);
  // Curve
  ctx.arc(hx - 5, y + 6, 5, 0, Math.PI * 1.1, false);
  ctx.stroke();

  // Barb tip
  ctx.beginPath();
  ctx.moveTo(hx - 10, y + 6);
  ctx.lineTo(hx - 7, y + 2);
  ctx.stroke();

  ctx.restore();
}

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function openFishingGame(gameState, location, onComplete) {
  // Prevent duplicate overlays
  if (document.getElementById('fishing-game-overlay')) return;

  // ── Constants derived from location ──────────────────────────────────────
  const title = location === 'beach' ? '🏖️ Beach Fishing!' : '🎣 Dock Fishing!';

  // ── Canvas size ───────────────────────────────────────────────────────────
  const CW = Math.min(640, window.innerWidth  - 32);
  const CH = Math.min(480, window.innerHeight - 120);

  // ── State ─────────────────────────────────────────────────────────────────
  let castNumber = 0;                 // 0-based, max TOTAL_CASTS
  let phase = 'descending';           // descending | waiting | biting | caught | missed | results
  let phaseStartTime = null;
  let results = [];                   // array of caught fish type objects (or null for misses)
  let totalBones = 0;
  let totalXP = 0;
  let lastCaughtFish = null;

  // Hook
  let hookY = 0;
  let hookTargetY = 0;
  let jiggle = 0;

  // Active fish
  let fish = null;           // { type, x, y, facingLeft, speed, biting }
  let fishRespawnTimer = 0;  // >0 = waiting to spawn

  // Bubbles (20 persistent)
  const bubbles = [];
  for (let i = 0; i < 20; i++) {
    bubbles.push({
      x: Math.random() * CW,
      y: CH * (0.2 + Math.random() * 0.8),
      r: 2 + Math.random() * 4,
      speed: 18 + Math.random() * 30,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  // Seaweed (7)
  const seaweed = [];
  for (let i = 0; i < 7; i++) {
    seaweed.push({
      x: 30 + (i / 6) * (CW - 60),
      height: 40 + Math.random() * 50,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // ── DOM ───────────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'fishing-game-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9200',
    background: 'rgba(5, 15, 40, 0.82)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', 'Comic Sans MS', Verdana, sans-serif",
  });

  // Title bar row
  const titleBar = document.createElement('div');
  Object.assign(titleBar.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: CW + 'px',
    marginBottom: '8px',
  });

  const titleEl = document.createElement('div');
  Object.assign(titleEl.style, {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#fff',
    textShadow: '0 2px 8px rgba(0,100,255,0.6)',
  });
  titleEl.textContent = title;

  const castCounter = document.createElement('div');
  Object.assign(castCounter.style, {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#aad4ff',
    background: 'rgba(0,40,100,0.6)',
    borderRadius: '10px',
    padding: '4px 14px',
  });

  titleBar.appendChild(titleEl);
  titleBar.appendChild(castCounter);

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.width  = CW;
  canvas.height = CH;
  Object.assign(canvas.style, {
    borderRadius: '14px',
    boxShadow: '0 8px 40px rgba(0,80,200,0.5)',
    display: 'block',
  });
  const ctx = canvas.getContext('2d');

  // Hint text below canvas
  const hintEl = document.createElement('div');
  Object.assign(hintEl.style, {
    color: '#aad4ff',
    fontSize: '0.9rem',
    marginTop: '8px',
    minHeight: '1.4em',
    textAlign: 'center',
    fontWeight: '600',
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  });

  // Leave button
  const leaveBtn = document.createElement('button');
  leaveBtn.textContent = 'Leave';
  Object.assign(leaveBtn.style, {
    marginTop: '12px',
    background: 'rgba(255,255,255,0.12)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '20px',
    color: '#cde',
    fontSize: '0.95rem',
    fontWeight: '700',
    padding: '8px 28px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  });
  leaveBtn.addEventListener('mouseenter', () => { leaveBtn.style.background = 'rgba(255,255,255,0.22)'; });
  leaveBtn.addEventListener('mouseleave', () => { leaveBtn.style.background = 'rgba(255,255,255,0.12)'; });

  overlay.appendChild(titleBar);
  overlay.appendChild(canvas);
  overlay.appendChild(hintEl);
  overlay.appendChild(leaveBtn);
  document.body.appendChild(overlay);

  // ── RAF loop ──────────────────────────────────────────────────────────────
  let rafId = null;
  let lastTime = null;

  function startCast() {
    phase = 'descending';
    phaseStartTime = null;
    fish = null;
    fishRespawnTimer = 0;
    jiggle = 0;
    hookY = 30;
    // Random target depth: 55%-85% of canvas height
    hookTargetY = CH * (0.55 + Math.random() * 0.30);
    castCounter.textContent = `Cast ${castNumber + 1} / ${TOTAL_CASTS}`;
    hintEl.textContent = 'Lowering the line…';
  }

  function spawnFish() {
    const type = pickFishType();
    const facingLeft = Math.random() < 0.5;
    const x = facingLeft ? CW + type.w : -type.w;
    // Swim at a depth near the hook (±80px)
    const hookCenter = hookY;
    const minY = CH * 0.25;
    const maxY = CH * 0.90;
    const y = Math.max(minY, Math.min(maxY, hookCenter + (Math.random() * 160 - 80)));
    fish = { type, x, y, facingLeft, speed: type.speed, biting: false };
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // seconds, capped
    lastTime = timestamp;

    if (!phaseStartTime) phaseStartTime = timestamp;
    const phaseElapsed = (timestamp - phaseStartTime) / 1000;

    // ── Update phase ────────────────────────────────────────────────────────
    if (phase === 'descending') {
      const t = Math.min(phaseElapsed / (HOOK_DESCENT_DURATION / 1000), 1);
      hookY = 30 + easeOut(t) * (hookTargetY - 30);
      if (t >= 1) {
        phase = 'waiting';
        phaseStartTime = timestamp;
        spawnFish();
        hintEl.textContent = 'Watch for a bite… Click or Space when the hook jiggles!';
      }

    } else if (phase === 'waiting') {
      // Move fish
      if (fish) {
        const dx = fish.facingLeft ? -fish.speed * dt : fish.speed * dt;
        fish.x += dx;

        // Check proximity for bite
        const distToHook = Math.abs(fish.x - (CW / 2)) + Math.abs(fish.y - hookY) * 0.6;
        if (distToHook < BITE_PROXIMITY) {
          phase = 'biting';
          phaseStartTime = timestamp;
          fish.biting = true;
          fish.speed *= 0.3;
          hintEl.textContent = '🐟 A fish is biting! Click or press Space/Enter NOW!';
        }

        // Fish escaped off screen
        if (fish.x < -fish.type.w * 2 || fish.x > CW + fish.type.w * 2) {
          fish = null;
          fishRespawnTimer = RESPAWN_DELAY / 1000;
        }
      } else {
        // Respawn timer
        fishRespawnTimer -= dt;
        if (fishRespawnTimer <= 0) spawnFish();
      }

    } else if (phase === 'biting') {
      jiggle = Math.sin(phaseElapsed * 18) * 5;

      // Move fish slowly in place — drift slightly toward hook X
      if (fish) {
        const dx = fish.facingLeft ? -fish.speed * dt : fish.speed * dt;
        fish.x += dx;
      }

      // Bite window expired → missed
      if (fish && phaseElapsed > fish.type.biteWindow) {
        phase = 'missed';
        phaseStartTime = timestamp;
        jiggle = 0;
        fish.biting = false;
        fish.speed = fish.type.speed;
        results.push(null);
        hintEl.textContent = '😅 The fish got away!';
      }

    } else if (phase === 'caught') {
      if (phaseElapsed >= CAUGHT_DURATION / 1000) {
        fish = null;
        castNumber++;
        if (castNumber >= TOTAL_CASTS) {
          phase = 'results';
          phaseStartTime = timestamp;
          hintEl.textContent = '';
        } else {
          startCast();
        }
      }

    } else if (phase === 'missed') {
      if (fish) {
        const dx = fish.facingLeft ? -fish.type.speed * dt : fish.type.speed * dt;
        fish.x += dx;
      }
      if (phaseElapsed >= MISSED_DURATION / 1000) {
        fish = null;
        castNumber++;
        jiggle = 0;
        if (castNumber >= TOTAL_CASTS) {
          phase = 'results';
          phaseStartTime = timestamp;
          hintEl.textContent = '';
        } else {
          startCast();
        }
      }
    }

    // ── Draw ────────────────────────────────────────────────────────────────
    if (phase === 'results') {
      drawResults();
    } else {
      drawScene(timestamp, phaseElapsed);
    }

    rafId = requestAnimationFrame(loop);
  }

  // ── Scene drawing ─────────────────────────────────────────────────────────
  function drawScene(timestamp, phaseElapsed) {
    const t = timestamp / 1000;

    // --- Background gradient ---
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, '#0a3a6e');
    bg.addColorStop(0.18, '#0d3060');
    bg.addColorStop(1,   '#020c1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // --- Light rays from top ---
    const numRays = 5;
    for (let i = 0; i < numRays; i++) {
      const rx = (CW * 0.15) + (i / (numRays - 1)) * CW * 0.7;
      const spread = 55 + i * 15;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx - spread, CH);
      ctx.lineTo(rx + spread, CH);
      ctx.closePath();
      const rayAlpha = 0.025 + 0.015 * Math.sin(t * 0.7 + i);
      ctx.fillStyle = `rgba(100,180,255,${rayAlpha})`;
      ctx.fill();
    }

    // --- Seaweed ---
    for (const sw of seaweed) {
      const segments = 6;
      const segH = sw.height / segments;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1e7a3e';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let sy = CH;
      ctx.moveTo(sw.x, sy);
      for (let s = 0; s < segments; s++) {
        sy -= segH;
        const offset = Math.sin(t * 1.8 + sw.phase + s * 0.6) * 10;
        ctx.lineTo(sw.x + offset, sy);
      }
      ctx.stroke();
      // Lighter accent
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2db358';
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // --- Bubbles ---
    for (const b of bubbles) {
      b.y -= b.speed * 0.016;
      b.wobble += 0.04;
      if (b.y < -10) {
        b.y = CH + 5;
        b.x = Math.random() * CW;
      }
      const bx = b.x + Math.sin(b.wobble) * 3;
      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,220,255,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(180,220,255,0.12)';
      ctx.fill();
    }

    // --- Water surface ---
    ctx.beginPath();
    ctx.moveTo(0, 28);
    for (let wx = 0; wx <= CW; wx += 4) {
      const wy = 28 + Math.sin(wx * 0.03 + t * 2) * 4 + Math.sin(wx * 0.07 - t * 1.3) * 2;
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(CW, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    const surfGrad = ctx.createLinearGradient(0, 0, 0, 30);
    surfGrad.addColorStop(0, 'rgba(100,190,255,0.65)');
    surfGrad.addColorStop(1, 'rgba(20,100,200,0.20)');
    ctx.fillStyle = surfGrad;
    ctx.fill();

    // Foam line
    ctx.beginPath();
    for (let wx = 0; wx <= CW; wx += 4) {
      const wy = 28 + Math.sin(wx * 0.03 + t * 2) * 4 + Math.sin(wx * 0.07 - t * 1.3) * 2;
      if (wx === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
    }
    ctx.strokeStyle = 'rgba(200,235,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Fishing line ---
    const lineX = CW / 2;
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX + jiggle * 0.3, hookY - 14);
    ctx.strokeStyle = 'rgba(220,220,200,0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // --- Hook ---
    drawHook(ctx, lineX, hookY, jiggle);

    // --- Fish ---
    if (fish) {
      drawFish(ctx, fish, fish.x, fish.y, fish.facingLeft);
    }

    // --- Golden glow pulse during biting ---
    if (phase === 'biting') {
      const pulseAlpha = 0.08 + 0.06 * Math.sin(phaseElapsed * 10);
      ctx.fillStyle = `rgba(255,230,80,${pulseAlpha})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // --- Caught overlay ---
    if (phase === 'caught' && lastCaughtFish) {
      ctx.fillStyle = 'rgba(30,180,80,0.22)';
      ctx.fillRect(0, 0, CW, CH);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.font = 'bold 26px "Segoe UI", Verdana, sans-serif';
      ctx.fillText(`🎉 Caught a ${lastCaughtFish.label}!`, CW / 2 + 2, CH / 2 - 22);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px "Segoe UI", Verdana, sans-serif';
      ctx.fillText(`🎉 Caught a ${lastCaughtFish.label}!`, CW / 2, CH / 2 - 24);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px "Segoe UI", Verdana, sans-serif';
      ctx.fillText(`+${lastCaughtFish.bones} 🦴  +${lastCaughtFish.xp} XP`, CW / 2, CH / 2 + 12);

      ctx.restore();
    }

    // --- Missed overlay ---
    if (phase === 'missed') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.font = 'bold 24px "Segoe UI", Verdana, sans-serif';
      ctx.fillText('😅 The fish got away!', CW / 2 + 2, CH / 2 + 2);
      ctx.fillStyle = '#ffccaa';
      ctx.fillText('😅 The fish got away!', CW / 2, CH / 2);
      ctx.restore();
    }
  }

  // ── Results screen ────────────────────────────────────────────────────────
  function drawResults() {
    // Dark background
    ctx.fillStyle = '#06142b';
    ctx.fillRect(0, 0, CW, CH);

    // Subtle radial glow
    const glow = ctx.createRadialGradient(CW / 2, CH / 2, 10, CW / 2, CH / 2, CW * 0.55);
    glow.addColorStop(0, 'rgba(0,100,200,0.25)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CW, CH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Title
    ctx.font = `bold ${Math.floor(CW * 0.055)}px "Segoe UI", Verdana, sans-serif`;
    ctx.fillStyle = '#aad4ff';
    ctx.fillText('🎣 Fishing Complete!', CW / 2, 28);

    // Catches list
    const catches = results.filter(Boolean);
    const startY = 80;
    const rowH = Math.min(50, (CH - startY - 80) / (TOTAL_CASTS + 1));

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const rowY = startY + i * rowH;

      // Row background
      ctx.fillStyle = r ? 'rgba(0,180,80,0.15)' : 'rgba(120,60,60,0.18)';
      roundRect(ctx, CW * 0.1, rowY, CW * 0.8, rowH - 4, 8);
      ctx.fill();

      ctx.font = `bold ${Math.floor(rowH * 0.42)}px "Segoe UI", Verdana, sans-serif`;
      ctx.textBaseline = 'middle';
      const midY = rowY + (rowH - 4) / 2;

      if (r) {
        ctx.fillStyle = '#7fffaa';
        ctx.textAlign = 'left';
        ctx.fillText(`Cast ${i + 1}:  ${r.label}`, CW * 0.14, midY);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`+${r.bones} 🦴  +${r.xp} XP`, CW * 0.88, midY);
      } else {
        ctx.fillStyle = '#ff9988';
        ctx.textAlign = 'center';
        ctx.fillText(`Cast ${i + 1}:  — missed —`, CW / 2, midY);
      }
    }

    // Totals
    const totY = startY + results.length * rowH + 14;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${Math.floor(CW * 0.047)}px "Segoe UI", Verdana, sans-serif`;
    ctx.fillStyle = '#ffd700';
    ctx.fillText(
      catches.length > 0
        ? `Total: ${catches.length} fish  •  ${totalBones} 🦴  •  ${totalXP} XP`
        : 'No catches this time — try again!',
      CW / 2,
      totY
    );

    // "Tap to continue" prompt
    ctx.font = `${Math.floor(CW * 0.034)}px "Segoe UI", Verdana, sans-serif`;
    ctx.fillStyle = 'rgba(180,210,255,0.7)';
    ctx.fillText('Click or press Enter to continue', CW / 2, CH - 32);
  }

  // ── Utility: rounded rect ─────────────────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Catch action ──────────────────────────────────────────────────────────
  function attemptCatch() {
    if (phase !== 'biting' || !fish) return;
    phase = 'caught';
    phaseStartTime = null;
    lastCaughtFish = fish.type;
    results.push(fish.type);
    totalBones += fish.type.bones;
    totalXP    += fish.type.xp;
    jiggle = 0;
    hintEl.textContent = `🎉 Caught a ${fish.type.label}! +${fish.type.bones} 🦴 +${fish.type.xp} XP`;
  }

  // ── Finish ────────────────────────────────────────────────────────────────
  function finish() {
    cleanup();
    overlay.remove();
    if (typeof onComplete === 'function') {
      onComplete({
        caught: results.filter(Boolean),
        bones: totalBones,
        xp: totalXP,
        results,
      });
    }
  }

  function cleanup() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.removeEventListener('keydown', onKey);
    canvas.removeEventListener('click', onCanvasClick);
    leaveBtn.removeEventListener('click', onLeave);
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      finish();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (phase === 'biting') {
        attemptCatch();
      } else if (phase === 'results') {
        finish();
      }
    }
  }

  function onCanvasClick() {
    if (phase === 'biting') {
      attemptCatch();
    } else if (phase === 'results') {
      finish();
    }
  }

  function onLeave() {
    finish();
  }

  document.addEventListener('keydown', onKey);
  canvas.addEventListener('click', onCanvasClick);
  leaveBtn.addEventListener('click', onLeave);

  // ── Kick off ──────────────────────────────────────────────────────────────
  startCast();
  rafId = requestAnimationFrame(loop);
}
