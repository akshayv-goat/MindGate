(function(){
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowMemory = 'deviceMemory' in navigator && navigator.deviceMemory <= 4;
  const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const lowPowerMode = prefersReduced || lowMemory || lowCPU;
  if (prefersReduced) {
    canvas.style.opacity = '0.06';
  }

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let particles = [];
  let streaks = [];
  let rafId = null;
  let brushCanvas = null;
  let lastFrameTime = 0;
  const targetInterval = lowPowerMode ? 1000 / 30 : 1000 / 45;

  function createBrush() {
    brushCanvas = document.createElement('canvas');
    const size = 44;
    brushCanvas.width = size;
    brushCanvas.height = size;
    const bctx = brushCanvas.getContext('2d');
    const gradient = bctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.14, 'rgba(255,255,255,0.36)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.08)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    bctx.clearRect(0, 0, size, size);
    bctx.fillStyle = gradient;
    bctx.fillRect(0, 0, size, size);
  }

  function resize() {
    const rawDpr = window.devicePixelRatio || 1;
    const maxDpr = lowPowerMode ? 1 : 1.5;
    dpr = Math.min(maxDpr, rawDpr);
    w = Math.max(1, window.innerWidth);
    h = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!brushCanvas) createBrush();
    initParticles();
  }

  function initParticles() {
    particles = [];
    streaks = [];
    const area = w * h;
    const divisor = lowPowerMode ? 7600 : 4200;
    const baseCount = Math.max(55, Math.floor(area / divisor));
    const cap = lowPowerMode ? 150 : 500;
    const count = Math.min(cap, baseCount);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function createParticle() {
    const size = 0.45 + Math.random() * 1.0;
    const speed = 0.5 + Math.random() * 1.4;
    const angle = (-40 + Math.random() * 80) * (Math.PI / 180);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.6),
      vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.6),
      size: size,
      alpha: 0.4 + Math.random() * 0.5
    };
  }

  function spawnStreak() {
    if (prefersReduced || lowPowerMode) return;
    const len = 120 + Math.random() * 180;
    streaks.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: -2.2 - Math.random() * 2.6,
      vy: -0.6 + Math.random() * 1.2,
      length: len,
      life: 0,
      maxLife: 18 + Math.floor(Math.random() * 22)
    });
    if (streaks.length > 14) streaks.shift();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      const r = Math.max(0.9, p.size * 2.2);
      ctx.globalAlpha = p.alpha * 0.88;
      ctx.drawImage(brushCanvas, p.x - r * 2, p.y - r * 2, r * 4, r * 4);
    }

    ctx.globalAlpha = 1;

    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
      const progress = s.life / s.maxLife;
      const alpha = Math.max(0, 0.75 * (1 - progress));
      const x2 = s.x + s.vx * s.length;
      const y2 = s.y + s.vy * s.length;
      const lg = ctx.createLinearGradient(s.x, s.y, x2, y2);
      lg.addColorStop(0, `rgba(255,255,255,${alpha})`);
      lg.addColorStop(0.6, `rgba(255,255,255,${alpha * 0.45})`);
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = lg;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (s.life > s.maxLife) streaks.splice(i, 1);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const delta = timestamp - lastFrameTime;
    if (delta >= targetInterval) {
      draw();
      lastFrameTime = timestamp - (delta % targetInterval);
      if (tick % 16 === 0) spawnStreak();
      tick++;
    }
    rafId = requestAnimationFrame(loop);
  }

  let tick = 0;

  function onVisibilityChange() {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if (!rafId) {
        lastFrameTime = 0;
        loop(performance.now());
      }
    }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();
  if (!prefersReduced) loop(performance.now());

})();
