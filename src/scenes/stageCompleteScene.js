import { Scene } from './scene.js';
import { NATIVE_WIDTH, NATIVE_HEIGHT, SCALE } from '../config.js';

// 폭발 파티클
class Particle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 110;
    this.x    = x;
    this.y    = y;
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed - 20; // 약간 위로
    this.size = 1 + Math.random() * 2.5;
    this.t    = 0;
    this.dur  = 1.0 + Math.random() * 1.2;
    const palette = ['#ff4444','#ff8800','#ffcc00','#44ff88','#4488ff','#cc44ff','#ffffff'];
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.active = true;
  }
  update(dt) {
    this.t  += dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vy += 55 * dt; // 중력
    if (this.t >= this.dur) this.active = false;
  }
  render(renderer) {
    const alpha = Math.max(0, 1 - this.t / this.dur);
    const a     = Math.floor(alpha * 255).toString(16).padStart(2, '0');
    const s     = Math.ceil(this.size * (1 - this.t / this.dur * 0.4));
    renderer.fillRect(
      Math.floor(this.x - s / 2), Math.floor(this.y - s / 2),
      Math.max(1, s), Math.max(1, s),
      this.color + a,
    );
  }
}

// 화면 중앙에서 터지는 큰 폭발 불꽃
class Burst {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.t      = 0;
    this.dur    = 0.6;
    this.active = true;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.dur) this.active = false;
  }
  render(renderer) {
    const p   = this.t / this.dur;
    const r   = 18 * p;
    const a   = Math.floor((1 - p) * 200).toString(16).padStart(2, '0');
    renderer.fillCircle(this.x, this.y, r,       `#ffaa00${a}`);
    renderer.fillCircle(this.x, this.y, r * 0.5, `#ffffff${a}`);
  }
}

export class StageCompleteScene extends Scene {
  constructor(game) {
    super(game);
    this._t          = 0;
    this._bonus      = 0;
    this._stage      = 1;
    this._done       = false;
    this._particles  = [];
    this._bursts     = [];
    this._flash      = 0;
    this._stars      = [];
  }

  enter() {
    this._t     = 0;
    this._done  = false;
    this._stage = this.game.scoreManager.stage;
    this._bonus = this.game.scoreManager.nextStage();
    this._flash = 1.0;
    this._particles = [];
    this._bursts    = [];

    // 파티클 — 화면 상단 중앙(보스가 있던 위치)에서 폭발
    const cx = NATIVE_WIDTH / 2;
    const cy = NATIVE_HEIGHT * 0.28;
    for (let i = 0; i < 55; i++) {
      this._particles.push(new Particle(cx + (Math.random() - 0.5) * 30, cy));
    }

    // 큰 폭발 불꽃 3개
    this._bursts.push(new Burst(cx, cy));
    this._bursts.push(new Burst(cx - 20, cy + 10));
    this._bursts.push(new Burst(cx + 20, cy + 10));

    // 배경 별
    this._stars = Array.from({ length: 70 }, () => ({
      x:    Math.random() * NATIVE_WIDTH,
      y:    Math.random() * NATIVE_HEIGHT,
      size: Math.random() < 0.25 ? 2 : 1,
      bri:  0.3 + Math.random() * 0.7,
      ph:   Math.random() * Math.PI * 2,
    }));

    this.game.soundManager?.stopBGM();
    this.game.soundManager?.play('stage_clear');
  }

  update(dt) {
    this._t += dt;
    if (this._flash > 0) this._flash = Math.max(0, this._flash - dt * 3.5);

    for (const p of this._particles) p.update(dt);
    for (const b of this._bursts)    b.update(dt);

    // 딜레이 폭발 추가 (0.3~1.0초 사이 산발적)
    if (this._t < 1.2 && Math.random() < 0.08) {
      const cx = NATIVE_WIDTH / 2;
      const cy = NATIVE_HEIGHT * 0.28;
      this._bursts.push(new Burst(
        cx + (Math.random() - 0.5) * 40,
        cy + (Math.random() - 0.5) * 20,
      ));
    }

    if (this._t > 3.8 && !this._done) {
      this._done = true;
      this.game.switchScene('game');
    }
  }

  render(renderer) {
    // ── 배경 ──────────────────────────────────────────────────────────────
    renderer.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT, '#04040e');

    for (const s of this._stars) {
      const blink = Math.sin(this._t * 1.8 + s.ph) * 0.3 + 0.7;
      const a     = Math.floor(s.bri * blink * 255).toString(16).padStart(2, '0');
      renderer.fillRect(s.x, s.y, s.size, s.size, `#ffffff${a}`);
    }

    // ── 폭발 불꽃 & 파티클 ───────────────────────────────────────────────
    for (const b of this._bursts)    b.render(renderer);
    for (const p of this._particles) p.render(renderer);

    // ── 텍스트 ────────────────────────────────────────────────────────────

    // "STAGE N" — 위에서 튀어 내려오는 bounce
    if (this._t > 0.15) {
      const elapsed = this._t - 0.15;
      const bounce  = elapsed < 0.35
        ? NATIVE_HEIGHT * 0.2 - (0.35 - elapsed) / 0.35 * 40
        : NATIVE_HEIGHT * 0.2;
      renderer.drawText(`STAGE  ${this._stage}`, NATIVE_WIDTH / 2, bounce, {
        fontSize: 12, color: '#ffff44', align: 'center',
      });
    }

    // "COMPLETE!" — pulse
    if (this._t > 0.45) {
      const pulse = Math.abs(Math.sin(this._t * 5)) * 0.06 + 0.97;
      const ctx   = renderer.context;
      ctx.save();
      ctx.translate(NATIVE_WIDTH / 2 * SCALE, (NATIVE_HEIGHT * 0.35) * SCALE);
      ctx.scale(pulse, pulse);
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `${10 * SCALE}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('COMPLETE!', 0, 0);
      ctx.restore();
    }

    // 구분선
    if (this._t > 0.9) {
      const alpha = Math.min(1, (this._t - 0.9) * 3);
      const a     = Math.floor(alpha * 180).toString(16).padStart(2, '0');
      renderer.fillRect(20, NATIVE_HEIGHT * 0.46, NATIVE_WIDTH - 40, 1, `#556688${a}`);
    }

    // BONUS
    if (this._t > 1.1) {
      const alpha = Math.min(1, (this._t - 1.1) * 4);
      const a     = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      renderer.drawText(`BONUS  +${this._bonus}`, NATIVE_WIDTH / 2,
        NATIVE_HEIGHT * 0.5, { fontSize: 8, color: `#00ff88${a}`, align: 'center' });
    }

    // TOTAL
    if (this._t > 1.8) {
      const alpha = Math.min(1, (this._t - 1.8) * 4);
      const a     = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      renderer.drawText(
        `TOTAL  ${String(this.game.scoreManager.score).padStart(8, '0')}`,
        NATIVE_WIDTH / 2, NATIVE_HEIGHT * 0.58,
        { fontSize: 7, color: `#ffffff${a}`, align: 'center' },
      );
    }

    // NEXT STAGE 깜빡임
    if (this._t > 2.8 && Math.floor(this._t * 2.5) % 2 === 0) {
      renderer.drawText('NEXT STAGE...', NATIVE_WIDTH / 2, NATIVE_HEIGHT * 0.76,
        { fontSize: 6, color: '#778899', align: 'center' });
    }

    // ── 진입 플래시 오버레이 ─────────────────────────────────────────────
    if (this._flash > 0) {
      const a = Math.floor(this._flash * 255).toString(16).padStart(2, '0');
      renderer.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT, `#ffffff${a}`);
    }
  }
}
