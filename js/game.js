/* Mikan Sort! — core game (vanilla canvas, no dependencies)
 * GWC HHS Hackathon 2026 — core build 2026-10-18
 * Features: item tiers by level, difficulty curve, combo multiplier, result screen.
 */
'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const $ = (id) => document.getElementById(id);
  const ui = {
    score: $('score'), lives: $('lives'), level: $('level'), streak: $('streak'),
    toast: $('toast'), start: $('overlay-start'), over: $('overlay-over'),
    finalScore: $('final-score'), finalImpact: $('final-impact'), finalBreakdown: $('final-breakdown'),
    finalStats: $('final-stats'), finalRank: $('final-rank'),
    bestScore: $('best-score'), soundBtn: $('sound-btn'),
  };

  const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const BEST_KEY = 'mikan-sort-best';

  // ---- layout constants (canvas space) ----
  const BELT = { y: 64, h: 220 };
  const ITEM_SIZE = 92;
  const ITEM_Y = BELT.y + (BELT.h - ITEM_SIZE) / 2;
  const BIN_AREA = { y: 356, h: 224, pad: 20, gap: 14 };

  const EMOJI_FONT = '46px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
  const LABEL_FONT = '600 13px -apple-system,"Segoe UI",Roboto,sans-serif';
  const SMALL_FONT = '11px -apple-system,"Segoe UI",Roboto,sans-serif';
  const FLOAT_FONT = '700 18px -apple-system,"Segoe UI",Roboto,sans-serif';

  // ---- state ----
  const S = {
    mode: 'menu', // menu | play | over
    score: 0, lives: 3, level: 1,
    combo: 0, maxCombo: 0,
    correct: 0, wrong: 0, missed: 0, nextLevelAt: 8,
    sortedBy: { recycle: 0, compost: 0, trash: 0, hazard: 0 },
    items: [], particles: [], floaters: [], beltOffset: 0, shake: 0,
    spawnTimer: 0, selected: null, lastSpawnName: null, frames: 0,
  };

  let raf = null;
  let lastT = 0;
  let toastTimeout = null;

  // ---- difficulty curve: the belt speeds up and spawns get denser per level (both capped) ----
  const MAX_SPEED = 170;
  const speed = () => Math.min(MAX_SPEED, 60 + (S.level - 1) * 14);
  const spawnInterval = () => Math.max(0.95, 2.4 - (S.level - 1) * 0.18);

  // ---- combo: consecutive correct sorts raise the multiplier ----
  // 3 in a row = x2 · 6 = x3 · 9 = x4 · 12+ = x5 (capped)
  const comboMult = () => 1 + Math.min(4, Math.floor(S.combo / 3));

  // ---- helpers ----
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function binRects() {
    const n = BINS.length;
    const total = W - BIN_AREA.pad * 2 - BIN_AREA.gap * (n - 1);
    const w = total / n;
    return BINS.map((bin, i) => ({
      bin,
      x: BIN_AREA.pad + i * (w + BIN_AREA.gap),
      y: BIN_AREA.y,
      w,
      h: BIN_AREA.h,
    }));
  }

  function binUnlocked(bin) {
    return !bin.unlockLevel || S.level >= bin.unlockLevel;
  }

  function toast(msg, kind = '', dur = 3000) {
    ui.toast.textContent = msg;
    ui.toast.className = 'toast ' + kind;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => ui.toast.classList.add('hidden'), dur);
  }

  function updateHud() {
    ui.score.textContent = S.score;
    ui.lives.textContent = '♥'.repeat(Math.max(0, S.lives));
    ui.level.textContent = 'Lv ' + S.level;
    ui.streak.textContent = S.combo > 0 ? `🔥 ${S.combo} combo · ×${comboMult()}` : '';
  }

  function getBest() {
    try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (e) { return 0; }
  }
  function setBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* ignore */ }
  }

  function rankFor(saved) {
    if (saved >= 40) return '🏆 Zero-Waste Legend';
    if (saved >= 25) return '🌟 Recycling Hero';
    if (saved >= 12) return '⭐ Sorting Star';
    return '🌱 Rookie Sorter — keep practicing!';
  }

  // ---- game flow ----
  function startGame() {
    S.mode = 'play';
    S.score = 0; S.lives = 3; S.level = 1;
    S.combo = 0; S.maxCombo = 0;
    S.correct = 0; S.wrong = 0; S.missed = 0; S.nextLevelAt = 8;
    S.sortedBy = { recycle: 0, compost: 0, trash: 0, hazard: 0 };
    S.items = []; S.particles = []; S.floaters = []; S.shake = 0;
    S.spawnTimer = 0.7; S.selected = null; S.lastSpawnName = null;
    ui.start.classList.add('hidden');
    ui.over.classList.add('hidden');
    ui.toast.classList.add('hidden');
    updateHud();
    lastT = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function levelUp() {
    S.level += 1;
    Sfx.levelUp();
    let msg = `Level ${S.level} — the belt speeds up!`;
    if (S.level === 2) msg = 'Level 2 — HAZARD bin open + new items! ⚠️';
    else if (S.level === 4) msg = 'Level 4 — expert trick items incoming! 🧠';
    toast(msg, 'good', 3000);
    updateHud();
  }

  function checkGameOver() {
    if (S.lives > 0) return;
    S.mode = 'over';
    Sfx.gameOver();
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    const total = S.correct + S.wrong + S.missed;
    const acc = total ? Math.round((S.correct / total) * 100) : 0;
    const saved = S.sortedBy.recycle + S.sortedBy.compost + S.sortedBy.hazard;
    const best = Math.max(getBest(), S.score);
    setBest(best);
    ui.finalScore.textContent = S.score + ' pts';
    // static template; `saved` is an internal counter (a number), never user input — safe.
    ui.finalImpact.innerHTML = `🍊 You kept <b>${saved}</b> item${saved === 1 ? '' : 's'} out of the landfill!`;
    ui.finalBreakdown.textContent =
      `♻️ ${S.sortedBy.recycle} recycled · 🍃 ${S.sortedBy.compost} composted · ` +
      `⚠️ ${S.sortedBy.hazard} hazard diverted · 🗑️ ${S.sortedBy.trash} trashed properly`;
    ui.finalStats.textContent =
      `Level ${S.level} · longest combo ${S.maxCombo} · accuracy ${acc}% ` +
      `(${S.correct} right · ${S.wrong} wrong · ${S.missed} missed)`;
    ui.finalRank.textContent = rankFor(saved);
    ui.bestScore.textContent = best;
    ui.over.classList.remove('hidden');
  }

  function loseLife() {
    S.lives -= 1;
    updateHud();
    checkGameOver();
  }

  // ---- spawning & sorting ----
  function spawn() {
    const pool = availableItems(S.level);
    let pick = pool[Math.floor(Math.random() * pool.length)];
    let guard = 0;
    while (pool.length > 1 && pick.name === S.lastSpawnName && guard++ < 8) {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
    S.lastSpawnName = pick.name;
    S.items.push({ data: pick, x: W + 10, y: ITEM_Y, size: ITEM_SIZE, selected: false });
  }

  function removeItem(item) {
    const i = S.items.indexOf(item);
    if (i >= 0) S.items.splice(i, 1);
    if (S.selected === item) S.selected = null;
  }

  function burst(x, y, color) {
    if (REDUCED_MOTION) return;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 160;
      S.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        life: 0.55 + Math.random() * 0.3, max: 0.85, color,
      });
    }
  }

  function floater(x, y, text, color) {
    S.floaters.push({ x, y, text, color, life: 1.15, max: 1.15 });
  }

  function sortItem(item, bin) {
    if (S.mode !== 'play' || !item) return;
    if (!binUnlocked(bin)) {
      toast('The HAZARD bin unlocks at Level 2!', '', 2200);
      return;
    }
    removeItem(item);
    if (bin.id === item.data.bin) {
      const multBefore = comboMult();
      S.correct += 1;
      S.sortedBy[bin.id] += 1;
      S.combo += 1;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      const mult = comboMult();
      const gained = (item.data.pts + (S.level - 1) * 2) * mult;
      S.score += gained;
      Sfx.correct();
      burst(item.x + item.size / 2, item.y + item.size / 2, '#3fb950');
      floater(item.x + item.size / 2, item.y + 4, `+${gained}${mult > 1 ? ` ×${mult}` : ''}`, '#3fb950');
      if (mult > multBefore) {
        Sfx.combo(mult);
        floater(item.x + item.size / 2, item.y - 26, `🔥 COMBO ×${mult}`, '#ffb347');
      }
      toast(`✓ ${item.data.icon} ${item.data.name} → ${bin.label}: ${item.data.fact}`, 'good', 3400);
      if (S.correct >= S.nextLevelAt) {
        S.nextLevelAt += 8;
        levelUp();
      }
    } else {
      const comboLost = S.combo >= 3;
      S.wrong += 1;
      S.combo = 0;
      S.lives -= 1;
      S.shake = REDUCED_MOTION ? 0 : 7;
      Sfx.wrong();
      const correctBin = BINS.find((b) => b.id === item.data.bin);
      if (comboLost) floater(item.x + item.size / 2, item.y + 4, '✗ combo lost', '#f85149');
      toast(`✗ ${item.data.icon} ${item.data.name} → ${correctBin.label}: ${item.data.fact}${comboLost ? ' Combo lost!' : ''}`, 'bad', 3800);
      updateHud();
      checkGameOver();
    }
    updateHud();
  }

  // ---- update ----
  function update(dt) {
    S.beltOffset = (S.beltOffset + speed() * dt) % 48;
    if (S.shake > 0) S.shake = Math.max(0, S.shake - 40 * dt);

    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0) {
      spawn();
      S.spawnTimer = spawnInterval();
    }

    for (let i = S.items.length - 1; i >= 0; i--) {
      const it = S.items[i];
      it.x -= speed() * dt;
      if (it.x + it.size < 0) {
        S.missed += 1;
        S.combo = 0;
        removeItem(it);
        Sfx.wrong();
        toast(`Missed ${it.data.icon} ${it.data.name}! It rolled off the belt.`, 'bad', 2400);
        loseLife();
        if (S.mode !== 'play') return;
      }
    }

    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.life -= dt;
      if (p.life <= 0) { S.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
    }

    for (let i = S.floaters.length - 1; i >= 0; i--) {
      const f = S.floaters[i];
      f.life -= dt;
      if (f.life <= 0) { S.floaters.splice(i, 1); continue; }
      if (!REDUCED_MOTION) f.y -= 36 * dt;
    }
  }

  // ---- draw ----
  function drawBelt() {
    ctx.fillStyle = '#11161d';
    roundRect(0, BELT.y, W, BELT.h, 0);
    ctx.fill();

    // moving diagonal stripes
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, BELT.y, W, BELT.h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,179,71,0.08)';
    ctx.lineWidth = 14;
    for (let x = -BELT.h + S.beltOffset; x < W + BELT.h; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, BELT.y + BELT.h);
      ctx.lineTo(x + BELT.h, BELT.y);
      ctx.stroke();
    }
    ctx.restore();

    // rails
    ctx.strokeStyle = 'rgba(255,179,71,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, BELT.y + 3); ctx.lineTo(W, BELT.y + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, BELT.y + BELT.h - 3); ctx.lineTo(W, BELT.y + BELT.h - 3); ctx.stroke();

    ctx.fillStyle = 'rgba(139,148,158,0.8)';
    ctx.font = SMALL_FONT;
    ctx.textAlign = 'left';
    ctx.fillText('← items move this way — sort them before they roll off!', 12, BELT.y - 12);
  }

  function drawItems() {
    for (const it of S.items) {
      const { x, y, size } = it;
      ctx.save();
      if (it.selected) {
        ctx.shadowColor = '#ffb347';
        ctx.shadowBlur = 22;
      }
      ctx.fillStyle = it.selected ? '#232c3a' : '#1a2230';
      ctx.strokeStyle = it.selected ? '#ffb347' : '#2d333b';
      ctx.lineWidth = it.selected ? 2.5 : 1.5;
      roundRect(x, y, size, size, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.font = EMOJI_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.data.icon, x + size / 2, y + size / 2 - 8);

      ctx.fillStyle = '#9fb0cc';
      ctx.font = SMALL_FONT;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(it.data.name, x + size / 2, y + size - 12, size - 10);
    }
  }

  function drawBins() {
    for (const r of binRects()) {
      const { bin, x, y, w, h } = r;
      const unlocked = binUnlocked(bin);
      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#141a22';
      roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.strokeStyle = bin.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '34px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bin.icon, x + w / 2, y + 44);

      ctx.fillStyle = bin.color;
      ctx.font = LABEL_FONT;
      ctx.fillText(bin.label, x + w / 2, y + 86);

      ctx.fillStyle = '#8b949e';
      ctx.font = SMALL_FONT;
      ctx.fillText(bin.hint, x + w / 2, y + 112, w - 16);

      ctx.fillStyle = '#e6edf3';
      ctx.fillText(`[${bin.key}]`, x + w / 2, y + h - 26);

      if (!unlocked) {
        ctx.fillStyle = '#e6edf3';
        ctx.font = LABEL_FONT;
        ctx.fillText(`🔒 Level ${bin.unlockLevel}`, x + w / 2, y + h - 60);
      }
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b0f14');
    grad.addColorStop(1, '#0d1420');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (S.shake > 0 && !REDUCED_MOTION) {
      ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    }

    drawBelt();
    drawItems();
    drawBins();

    for (const p of S.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const f of S.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.color;
      ctx.font = FLOAT_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    S.frames += 1;
    if (S.mode === 'play') update(dt);
    draw();
    if (S.mode === 'play') raf = requestAnimationFrame(loop);
  }

  // ---- input ----
  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  }

  canvas.addEventListener('click', (e) => {
    if (S.mode !== 'play') return;
    const p = canvasPos(e);

    for (let i = S.items.length - 1; i >= 0; i--) {
      const it = S.items[i];
      if (p.x >= it.x && p.x <= it.x + it.size && p.y >= it.y && p.y <= it.y + it.size) {
        for (const o of S.items) o.selected = false;
        it.selected = true;
        S.selected = it;
        return;
      }
    }

    for (const r of binRects()) {
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
        if (S.selected) sortItem(S.selected, r.bin);
        else toast('Pick an item first — click one on the belt.', '', 1800);
        return;
      }
    }

    for (const o of S.items) o.selected = false;
    S.selected = null;
  });

  window.addEventListener('keydown', (e) => {
    if (S.mode !== 'play') {
      if (e.key === 'Enter' && S.mode === 'menu') startGame();
      return;
    }
    if (['1', '2', '3', '4'].includes(e.key)) {
      const bin = BINS[parseInt(e.key, 10) - 1];
      const target = S.selected || S.items.reduce((min, it) => (!min || it.x < min.x ? it : min), null);
      if (target && bin) sortItem(target, bin);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const leftmost = S.items.reduce((min, it) => (!min || it.x < min.x ? it : min), null);
      if (leftmost) {
        for (const o of S.items) o.selected = false;
        leftmost.selected = true;
        S.selected = leftmost;
      }
    } else if (e.key === 'Escape') {
      for (const o of S.items) o.selected = false;
      S.selected = null;
    }
  });

  // ---- boot ----
  ui.soundBtn.addEventListener('click', () => {
    const on = Sfx.toggle();
    ui.soundBtn.textContent = on ? '🔊' : '🔇';
  });
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('restart-btn').addEventListener('click', startGame);

  ui.bestScore.textContent = getBest();
  draw(); // idle background behind the start overlay

  // debug/test hook (harmless in production; used by automated smoke tests)
  window.__MikanSort = S;
})();
