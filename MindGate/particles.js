(function(){
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    canvas.style.opacity = '0.06';
  }

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = window.devicePixelRatio || 1;
  let particles = [];
  let streaks = [];
  let rafId = null;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = Math.max(1, window.innerWidth);
    h = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initParticles();
  }

  function initParticles() {
    particles = [];
    streaks = [];
    const area = w * h;
    // tuned density: slightly fewer particles for better visual clarity
    const baseCount = Math.floor(area / 4800);
    const cap = 700; // safety cap
    const count = prefersReduced ? Math.min(48, Math.floor(baseCount / 6)) : Math.min(cap, Math.max(70, baseCount));
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function createParticle() {
    const size = 0.4 + Math.random() * 1.0; // small
    // slower speeds: base slower and lower variance
    const speed = 0.6 + Math.random() * 1.6;
    const angle = (-40 + Math.random() * 80) * (Math.PI/180);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.7),
      vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.7),
      size: size,
      alpha: 0.5 + Math.random() * 0.5
    };
  }

  function spawnStreak() {
    if (prefersReduced) return;
    const len = 160 + Math.random() * 240; // longer streaks
    streaks.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: -3 - Math.random() * 4, // faster streak velocity
      vy: -0.8 + Math.random() * 1.6,
      length: len,
      life: 0,
      maxLife: 20 + Math.floor(Math.random() * 30)
    });
    // cap streaks
    if (streaks.length > 18) streaks.shift();
  }

  function draw() {
    ctx.clearRect(0,0,w,h);
    // glow blend
    ctx.globalCompositeOperation = 'lighter';

    // draw particles (bright white, small)
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      // wrap smoothly
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

        // stronger center glow, quicker falloff to reduce exterior haze
        const r = Math.max(0.8, p.size * 2.0);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
        g.addColorStop(0, `rgba(255,255,255,${p.alpha})`);
        g.addColorStop(0.12, `rgba(255,255,255,${Math.max(0.18, p.alpha * 0.28)})`);
        g.addColorStop(0.4, `rgba(255,255,255,${Math.max(0.06, p.alpha * 0.08)})`);
        g.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r*3.2, p.y - r*3.2, r*6.4, r*6.4);
    }

    // draw streaks
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
      const progress = s.life / s.maxLife;
      const alpha = Math.max(0, 0.85 * (1 - progress));
      const x2 = s.x + s.vx * s.length;
      const y2 = s.y + s.vy * s.length;
      const lg = ctx.createLinearGradient(s.x, s.y, x2, y2);
      lg.addColorStop(0, `rgba(255,255,255,${alpha})`);
      lg.addColorStop(0.6, `rgba(255,255,255,${alpha*0.5})`);
      lg.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.strokeStyle = lg;
      ctx.lineWidth = 0.6 + Math.random()*1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (s.life > s.maxLife) streaks.splice(i,1);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  let tick = 0;
  function loop() {
    draw();
    tick++;
    if (tick % 14 === 0 && Math.random() < 0.6) spawnStreak();
    rafId = requestAnimationFrame(loop);
  }

  // visibility and perf handling
  function onVisibilityChange() {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if (!rafId) loop();
    }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  // init
  resize();
  if (!prefersReduced) loop();

})();
