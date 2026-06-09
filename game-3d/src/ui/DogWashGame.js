// DogWashGame.js — Canvas-based bubble-popping dog wash mini-game.
// Adventures With Puppies — children's dog game
// No external imports required.

export function openDogWashGame(gameState, onComplete) {
  // Prevent duplicate overlays
  if (document.getElementById('dogwash-overlay')) return;

  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------
  const TOTAL_BUBBLES = 15;
  const PASTEL_COLORS = [
    { fill: 'rgba(255,182,210,0.80)', rim: 'rgba(220,100,140,0.55)' }, // pink
    { fill: 'rgba(165,210,255,0.80)', rim: 'rgba( 80,140,220,0.55)' }, // blue
    { fill: 'rgba(200,175,255,0.80)', rim: 'rgba(130, 80,200,0.55)' }, // lavender
    { fill: 'rgba(170,240,210,0.80)', rim: 'rgba( 60,170,130,0.55)' }, // mint
  ];

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  let poppedCount = 0;
  let gameActive = true;
  let rafId = null;
  let bubbles = [];       // live bubbles
  let particles = [];     // pop particles
  let finishTimeout = null;

  // -------------------------------------------------------------------------
  // DOM — full-screen overlay
  // -------------------------------------------------------------------------
  const overlay = document.createElement('div');
  overlay.id = 'dogwash-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9300',
    background: 'rgba(0,80,90,0.88)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', 'Comic Sans MS', Tahoma, sans-serif",
  });

  // Title
  const titleEl = document.createElement('div');
  Object.assign(titleEl.style, {
    color: '#b2f0f8',
    fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
    fontWeight: '800',
    marginBottom: '10px',
    textShadow: '0 2px 6px rgba(0,0,0,0.40)',
    letterSpacing: '0.04em',
  });
  titleEl.textContent = 'Bath Time! Pop all the bubbles!';

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 420;
  Object.assign(canvas.style, {
    borderRadius: '20px',
    boxShadow: '0 6px 32px rgba(0,0,0,0.50)',
    cursor: 'pointer',
    touchAction: 'none',
    maxWidth: '96vw',
    maxHeight: '64vh',
    display: 'block',
  });
  const ctx = canvas.getContext('2d');

  // Progress bar wrapper
  const progressWrap = document.createElement('div');
  Object.assign(progressWrap.style, {
    marginTop: '12px',
    width: '480px',
    maxWidth: '96vw',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  });

  const progressLabel = document.createElement('div');
  Object.assign(progressLabel.style, {
    color: '#c8f0ff',
    fontSize: '0.95rem',
    fontWeight: '700',
    textAlign: 'center',
  });
  progressLabel.textContent = `0/${TOTAL_BUBBLES} bubbles popped`;

  const progressBarBg = document.createElement('div');
  Object.assign(progressBarBg.style, {
    width: '100%',
    height: '12px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    overflow: 'hidden',
  });

  const progressBar = document.createElement('div');
  Object.assign(progressBar.style, {
    height: '100%',
    width: '0%',
    background: 'linear-gradient(90deg, #60e0f8, #a0f0c0)',
    borderRadius: '8px',
    transition: 'width 0.25s ease',
  });
  progressBarBg.appendChild(progressBar);
  progressWrap.appendChild(progressLabel);
  progressWrap.appendChild(progressBarBg);

  // "All Done!" button row
  const btnRow = document.createElement('div');
  Object.assign(btnRow.style, {
    marginTop: '12px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  });

  const doneBtn = document.createElement('button');
  Object.assign(doneBtn.style, {
    background: 'linear-gradient(135deg, #60e0f8, #a080f0)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    padding: '10px 28px',
    fontSize: '1.0rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 3px 12px rgba(80,120,200,0.30)',
    transition: 'transform 0.12s',
    outline: 'none',
  });
  doneBtn.textContent = 'All Done!';
  doneBtn.addEventListener('mouseenter', () => { doneBtn.style.transform = 'scale(1.06)'; });
  doneBtn.addEventListener('mouseleave', () => { doneBtn.style.transform = 'scale(1)'; });
  doneBtn.addEventListener('click', () => completeGame());
  btnRow.appendChild(doneBtn);

  overlay.appendChild(titleEl);
  overlay.appendChild(canvas);
  overlay.appendChild(progressWrap);
  overlay.appendChild(btnRow);
  document.body.appendChild(overlay);

  // -------------------------------------------------------------------------
  // Dog silhouette geometry (canvas coords, centered in 480x420)
  // -------------------------------------------------------------------------
  const DOG = {
    // Body ellipse
    bodyX: 240, bodyY: 250, bodyRX: 100, bodyRY: 65,
    // Head circle
    headX: 310, headY: 180, headR: 48,
    // Left ear
    ear1X: 285, ear1Y: 148, ear1RX: 18, ear1RY: 26, ear1Rot: -0.4,
    // Right ear
    ear2X: 330, ear2Y: 142, ear2RX: 14, ear2RY: 24, ear2Rot: 0.3,
    // Tail — arc from back of body
    tailStartX: 142, tailStartY: 235,
    // Snout
    snoutX: 348, snoutY: 196, snoutRX: 20, snoutRY: 14,
    // Legs (4 short rectangles under body)
    legs: [
      { x: 172, y: 302, w: 20, h: 38 },
      { x: 202, y: 302, w: 20, h: 38 },
      { x: 262, y: 302, w: 20, h: 38 },
      { x: 292, y: 302, w: 20, h: 38 },
    ],
  };

  // Bounding box around the dog for bubble placement
  const DOG_AREA = { x: 140, y: 130, w: 230, h: 190 };

  // -------------------------------------------------------------------------
  // Spawn bubbles
  // -------------------------------------------------------------------------
  function spawnBubbles() {
    bubbles = [];
    for (let i = 0; i < TOTAL_BUBBLES; i++) {
      const pal = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
      const r = 18 + Math.random() * 14; // 18-32
      const x = DOG_AREA.x + r + Math.random() * (DOG_AREA.w - r * 2);
      const y = DOG_AREA.y + r + Math.random() * (DOG_AREA.h - r * 2);
      bubbles.push({
        x, y,
        r,
        baseX: x,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.6 + Math.random() * 0.8,
        fill: pal.fill,
        rim: pal.rim,
        alive: true,
        popT: -1,  // timestamp when popped (-1 = not popped)
      });
    }
  }

  // -------------------------------------------------------------------------
  // Drawing helpers
  // -------------------------------------------------------------------------
  function drawDog(ctx) {
    ctx.save();
    const color = '#d4a96a';
    const dark  = '#b07840';
    const pink  = '#f0c0c0';

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(240, 320, 105, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Legs
    ctx.fillStyle = color;
    for (const leg of DOG.legs) {
      ctx.beginPath();
      ctx.roundRect(leg.x, leg.y, leg.w, leg.h, 8);
      ctx.fill();
    }

    // Body
    ctx.beginPath();
    ctx.ellipse(DOG.bodyX, DOG.bodyY, DOG.bodyRX, DOG.bodyRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tail (curved arc)
    ctx.beginPath();
    ctx.moveTo(DOG.tailStartX, DOG.tailStartY);
    ctx.bezierCurveTo(110, 200, 95, 170, 118, 148);
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ears
    ctx.fillStyle = dark;
    ctx.save();
    ctx.translate(DOG.ear1X, DOG.ear1Y);
    ctx.rotate(DOG.ear1Rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, DOG.ear1RX, DOG.ear1RY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(DOG.ear2X, DOG.ear2Y);
    ctx.rotate(DOG.ear2Rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, DOG.ear2RX, DOG.ear2RY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.beginPath();
    ctx.arc(DOG.headX, DOG.headY, DOG.headR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Snout
    ctx.beginPath();
    ctx.ellipse(DOG.snoutX, DOG.snoutY, DOG.snoutRX, DOG.snoutRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = pink;
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.ellipse(DOG.snoutX, DOG.snoutY - 4, 7, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = dark;
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(330, 172, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    // Eye shine
    ctx.beginPath();
    ctx.arc(332, 170, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.restore();
  }

  function drawBubble(ctx, b, now) {
    if (!b.alive && b.popT < 0) return;

    let alpha = 1.0;
    let scale = 1.0;

    if (!b.alive) {
      // Pop animation: expand + fade over 300ms
      const elapsed = now - b.popT;
      const t = Math.min(elapsed / 300, 1.0);
      scale = 1.0 + t * 0.6;
      alpha = 1.0 - t;
      if (t >= 1.0) return;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(b.x, b.y);
    ctx.scale(scale, scale);

    // Main bubble circle
    const grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.05, 0, 0, b.r);
    grad.addColorStop(0, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.4, b.fill);
    grad.addColorStop(1.0, b.rim);

    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim
    ctx.strokeStyle = b.rim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Highlight glint
    ctx.beginPath();
    ctx.ellipse(-b.r * 0.28, -b.r * 0.30, b.r * 0.22, b.r * 0.13, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.fill();

    // Tiny secondary glint
    ctx.beginPath();
    ctx.arc(-b.r * 0.42, -b.r * 0.45, b.r * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();

    ctx.restore();
  }

  function drawParticles(ctx, now) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const elapsed = now - p.startTime;
      const t = elapsed / 300;
      if (t >= 1.0) {
        particles.splice(i, 1);
        continue;
      }
      const alpha = 1.0 - t;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(
        p.x + p.vx * elapsed * 0.001,
        p.y + p.vy * elapsed * 0.001,
        p.r * (1.0 - t * 0.5),
        0, Math.PI * 2
      );
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnPopParticles(bx, by, fillColor, now) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const speed = 60 + Math.random() * 80;
      particles.push({
        x: bx,
        y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 4,
        color: fillColor,
        startTime: now,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Win screen (drawn on canvas)
  // -------------------------------------------------------------------------
  function drawWinScreen(ctx) {
    ctx.save();
    // Dim background
    ctx.fillStyle = 'rgba(0,60,70,0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sparkle circles
    const sparkles = [
      [120, 100], [360, 90], [80, 300], [400, 310], [240, 60],
    ];
    for (const [sx, sy] of sparkles) {
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,230,80,0.75)';
      ctx.fill();
    }

    // Main message box
    const bw = 340, bh = 130;
    const bx = (canvas.width - bw) / 2;
    const by = (canvas.height - bh) / 2;

    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 20);
    ctx.fillStyle = 'rgba(200,255,240,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,200,180,0.80)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 42px "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#1a6a6a';
    ctx.fillText('✨ Squeaky Clean!', canvas.width / 2, by + 52);

    ctx.font = 'bold 20px "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#2a9a80';
    ctx.fillText('Great job! 🐾', canvas.width / 2, by + 94);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Game loop
  // -------------------------------------------------------------------------
  let winMode = false;
  let winStartTime = 0;

  function loop(now) {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a8090');
    bgGrad.addColorStop(1, '#0d5060');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soapy foam patches (decorative)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    for (const [fx, fy, fr] of [[60,380,30],[400,370,25],[200,400,20],[320,390,28],[80,360,18]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Dog
    drawDog(ctx);

    // Bubbles (alive + popping)
    for (const b of bubbles) {
      if (b.alive) {
        // Gentle drift wobble
        b.phase += 0.016 * b.driftSpeed;
        b.x = b.baseX + Math.sin(b.phase) * 3;
        b.y = b.baseY + Math.cos(b.phase * 0.7) * 2;
      }
      drawBubble(ctx, b, now);
    }

    // Pop particles
    drawParticles(ctx, now);

    // Win screen overlay
    if (winMode) {
      drawWinScreen(ctx);
      if (now - winStartTime > 1500) {
        completeGame();
        return;
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------
  // Input handling
  // -------------------------------------------------------------------------
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    let cx, cy;
    if (e.touches) {
      cx = (e.touches[0].clientX - rect.left) * scaleX;
      cy = (e.touches[0].clientY - rect.top)  * scaleY;
    } else {
      cx = (e.clientX - rect.left) * scaleX;
      cy = (e.clientY - rect.top)  * scaleY;
    }
    return { cx, cy };
  }

  function handlePop(e) {
    if (!gameActive || winMode) return;
    e.preventDefault();
    const { cx, cy } = getCanvasPos(e);
    const now = performance.now();

    for (const b of bubbles) {
      if (!b.alive) continue;
      const dx = cx - b.x;
      const dy = cy - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        b.alive = false;
        b.popT = now;
        spawnPopParticles(b.x, b.y, b.fill, now);
        poppedCount++;

        progressLabel.textContent = `${poppedCount}/${TOTAL_BUBBLES} bubbles popped`;
        progressBar.style.width = `${(poppedCount / TOTAL_BUBBLES) * 100}%`;

        if (poppedCount >= TOTAL_BUBBLES) {
          winMode = true;
          winStartTime = now;
        }
        break; // one bubble per click/tap
      }
    }
  }

  canvas.addEventListener('click', handlePop);
  canvas.addEventListener('touchstart', handlePop, { passive: false });

  // Escape key
  function escHandler(e) {
    if (e.key === 'Escape') completeGame();
  }
  document.addEventListener('keydown', escHandler);

  // -------------------------------------------------------------------------
  // Complete / clean up
  // -------------------------------------------------------------------------
  function completeGame() {
    if (!gameActive) return;
    gameActive = false;

    if (rafId !== null) cancelAnimationFrame(rafId);
    if (finishTimeout !== null) clearTimeout(finishTimeout);

    canvas.removeEventListener('click', handlePop);
    canvas.removeEventListener('touchstart', handlePop);
    document.removeEventListener('keydown', escHandler);

    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);

    if (typeof onComplete === 'function') {
      onComplete({ washed: true, happiness: 30, coins: 5 });
    }
  }

  // -------------------------------------------------------------------------
  // Start
  // -------------------------------------------------------------------------
  spawnBubbles();
  rafId = requestAnimationFrame(loop);
}
