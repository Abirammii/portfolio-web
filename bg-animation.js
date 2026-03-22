// ═══════════════════════════════════════════════════
// ABIRAMI K — Animated Background Canvas
// Data Engineering / ML / ETL floating elements
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Gradient palette (soft pink) ──
  const GRAD_STOPS = [
    { pos: 0.00, color: '#FADADD' },
    { pos: 0.25, color: '#F8C8DC' },
    { pos: 0.50, color: '#F5B6C4' },
    { pos: 0.75, color: '#F8C8DC' },
    { pos: 1.00, color: '#FADADD' },
  ];

  // ── Symbol library: Data / ML / ETL glyphs ──
  const SYMBOLS = [
    // Database
    'ETL', 'Data', 'Visualize',
    // Code / pipeline
    'Load', '</>', 'Analyze', 'API', '⟶',
    // ML nodes
    '◎', '⊕', '⊗',
    // Charts
    '▁▃▅▇', '╱╱╱',
    // ETL / flow
    '▶▶', 'ML', '%',
    // Data packets
    '▪▪▪', '░░', '▓',
    // AI
    '∑', 'λ', 'Δ', 'π',
    // Arrows / flow
    '↗', 'db', 'SQL',
  ];

  // ── Particle class ──
  class Particle {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.reset(true);
    }

    reset(initial) {
      this.x = Math.random() * this.w;
      // start below viewport if not initial so they drift upward into view
      this.y = initial ? Math.random() * this.h : this.h + 20;

      this.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

      // Varied sizes
      this.size = 10 + Math.random() * 14;

      // Very low opacity — stay subtle
      this.baseAlpha = 0.04 + Math.random() * 0.10;
      this.alpha = 0;
      this.targetAlpha = this.baseAlpha;

      // Movement — slow drift upward with slight horizontal wander
      this.vy = -(0.18 + Math.random() * 0.28);   // upward
      this.vx = (Math.random() - 0.5) * 0.18;      // slight horizontal

      // Rotation
      this.angle = Math.random() * Math.PI * 2;
      this.vAngle = (Math.random() - 0.5) * 0.004;

      // Fade phase: 0=in, 1=hold, 2=out
      this.phase = 0;
      this.life = 0;
      this.maxLife = 280 + Math.random() * 220;

      // Font weight variety
      this.bold = Math.random() > 0.6;
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.vAngle;

      const t = this.life / this.maxLife;

      if (t < 0.15) {
        // Fade in
        this.alpha = this.baseAlpha * (t / 0.15);
      } else if (t < 0.80) {
        // Hold with gentle pulse
        const pulse = Math.sin(this.life * 0.03) * 0.012;
        this.alpha = this.baseAlpha + pulse;
      } else {
        // Fade out
        this.alpha = this.baseAlpha * (1 - (t - 0.80) / 0.20);
      }

      this.alpha = Math.max(0, Math.min(0.18, this.alpha));

      if (this.life >= this.maxLife || this.y < -40) {
        this.reset(false);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.font = `${this.bold ? '600' : '400'} ${this.size}px 'DM Sans', monospace`;
      ctx.fillStyle = '#8b1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.symbol, 0, 0);
      ctx.restore();
    }
  }

  // ── Connection lines between nearby particles ──
  function drawConnections(particles) {
    const MAX_DIST = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const lineAlpha = (1 - dist / MAX_DIST) * 0.04;
          ctx.save();
          ctx.globalAlpha = lineAlpha;
          ctx.strokeStyle = '#d4766a';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ── Gradient animation ──
  let gradOffset = 0;

  function drawGradient(w, h) {
    // Animated horizontal gradient: offset scrolls slowly
    gradOffset = (gradOffset + 0.0008) % 1;

    const gx = Math.sin(gradOffset * Math.PI * 2) * w * 0.4;
    const grad = ctx.createLinearGradient(
      w * 0.5 + gx, 0,
      w * 0.5 - gx + w * 0.3, h
    );

    GRAD_STOPS.forEach(s => grad.addColorStop(s.pos, s.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle secondary radial shimmer
    const shimmerX = w * 0.5 + Math.sin(gradOffset * Math.PI * 4) * w * 0.25;
    const shimmerY = h * 0.4 + Math.cos(gradOffset * Math.PI * 3) * h * 0.15;
    const shimmer = ctx.createRadialGradient(shimmerX, shimmerY, 0, shimmerX, shimmerY, w * 0.45);
    shimmer.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    shimmer.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shimmer;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Resize handler ──
  let W = 0, H = 0;
  let particles = [];
  const PARTICLE_COUNT_BASE = 28;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Scale particle count with screen area (cap for perf)
    const area = W * H;
    const count = Math.min(Math.floor(PARTICLE_COUNT_BASE * (area / (1440 * 900))), 48);

    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(W, H));
    }
  }

  // ── RAF loop ──
  let rafId = null;
  let lastTime = 0;
  const TARGET_FPS = 60;
  const FRAME_BUDGET = 1000 / TARGET_FPS;

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const delta = now - lastTime;
    if (delta < FRAME_BUDGET * 0.8) return; // skip if too soon
    lastTime = now;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // 1. Animated gradient
    drawGradient(W, H);

    // 2. Connection lines
    drawConnections(particles);

    // 3. Particles
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
  }

  // ── Visibility: pause when tab hidden ──
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      lastTime = 0;
      rafId = requestAnimationFrame(loop);
    }
  });

  // ── Reduced motion: skip animation ──
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    // Just draw a static gradient and bail
    resize();
    drawGradient(W, H);
    return;
  }

  // ── Init ──
  resize();
  window.addEventListener('resize', resize, { passive: true });
  rafId = requestAnimationFrame(loop);

})();
