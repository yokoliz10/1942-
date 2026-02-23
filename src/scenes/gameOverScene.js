import { Scene }  from './scene.js';
import { NATIVE_WIDTH, NATIVE_HEIGHT } from '../config.js';

// ── 랭크 계산 ─────────────────────────────────────────────────────────────
function calcRank(score, stage) {
  if (score >= 50000 || stage >= 8) return 'S';
  if (score >= 20000 || stage >= 5) return 'A';
  if (score >= 8000  || stage >= 3) return 'B';
  if (score >= 3000  || stage >= 2) return 'C';
  return 'D';
}

const RANK_COLOR  = { S: '#ffdd00', A: '#00eeff', B: '#44ff88', C: '#ffaa00', D: '#ff6666' };
const RANK_SHADOW = { S: '#664400', A: '#004466', B: '#004422', C: '#664400', D: '#440000' };

export class GameOverScene extends Scene {
  constructor(game) {
    super(game);
    this._t          = 0;
    this._waiting    = false;
    this._finalScore = 0;
    this._finalHi    = 0;
    this._finalStage = 1;
    this._newRecord  = false;
    this._rank       = 'D';
    this._flashAlpha = 0;
  }

  enter() {
    this._t       = 0;
    this._waiting = false;
    this.game.soundManager?.stopBGM();

    // 씬 진입 전에 스냅샷 (reset() 호출 전)
    const sm         = this.game.scoreManager;
    this._finalScore = sm.score;
    this._finalHi    = sm.hiscore;
    this._finalStage = sm.stage;
    this._newRecord  = sm.score > 0 && sm.score >= sm.hiscore;
    this._rank       = calcRank(sm.score, sm.stage);
    this._flashAlpha = this._newRecord ? 1.0 : 0;  // 신기록 시 진입 플래시
  }

  update(dt) {
    this._t += dt;
    if (this._flashAlpha > 0) this._flashAlpha = Math.max(0, this._flashAlpha - dt * 3.5);
    if (this._t > 1.8) this._waiting = true;
    if (!this._waiting) return;

    const input = this.game.input;

    if (input.isPressed('KeyR')) {
      this.game.scoreManager.reset();
      this.game.switchScene('game');
      return;
    }
    if (input.isPressed('Space') || input.isPressed('Enter') || input.isPressed('KeyZ')) {
      this.game.scoreManager.reset();
      this.game.switchScene('title');
    }
  }

  render(renderer) {
    const W = NATIVE_WIDTH;
    const H = NATIVE_HEIGHT;
    const t = this._t;

    // ── 배경 ──────────────────────────────────────────────────────────────
    renderer.fillRect(0, 0, W, H, '#000000');

    // 상단 장식선
    renderer.fillRect(0, 60, W, 1, '#441111');
    renderer.fillRect(0, 62, W, 1, '#882222');
    renderer.fillRect(0, 64, W, 1, '#441111');

    // ── GAME OVER 타이틀 ───────────────────────────────────────────────────
    renderer.drawText('GAME OVER', W / 2 + 1, 75,
      { fontSize: 16, color: '#550000', align: 'center' });
    renderer.drawText('GAME OVER', W / 2, 74,
      { fontSize: 16, color: '#ff2222', align: 'center' });

    // ── 랭크 배지 (좌상단) ─────────────────────────────────────────────────
    if (t > 0.15) {
      this._drawRankBadge(renderer, t);
    }

    // ── 스코어 ────────────────────────────────────────────────────────────
    if (t > 0.4) {
      const a  = Math.min(255, Math.floor((t - 0.4) / 0.35 * 255));
      const ah = a.toString(16).padStart(2, '0');
      renderer.drawText('SCORE', W / 2, 112,
        { fontSize: 5, color: `#888888${ah}`, align: 'center' });
      renderer.drawText(String(this._finalScore).padStart(8, '0'), W / 2, 120,
        { fontSize: 8, color: `#ffffff${ah}`, align: 'center' });
    }

    // ── 하이스코어 ────────────────────────────────────────────────────────
    if (t > 0.65) {
      const a  = Math.min(255, Math.floor((t - 0.65) / 0.35 * 255));
      const ah = a.toString(16).padStart(2, '00');
      renderer.drawText('HI-SCORE', W / 2, 134,
        { fontSize: 5, color: `#888888${ah}`, align: 'center' });
      const hiColor = this._newRecord ? `#ffee44${ah}` : `#aaaaaa${ah}`;
      renderer.drawText(String(this._finalHi).padStart(8, '0'), W / 2, 142,
        { fontSize: 8, color: hiColor, align: 'center' });
    }

    // ── 신기록 알림 ───────────────────────────────────────────────────────
    if (this._newRecord && t > 0.7) {
      // "★ NEW HIGH SCORE ★" 깜빡임
      if (Math.floor(t * 2.5) % 2 === 0) {
        renderer.drawText('★  NEW  HIGH  SCORE  ★', W / 2, 155,
          { fontSize: 6, color: '#ffdd00', align: 'center' });
      }
      // "SCORE SAVED" 확인 메시지 (1초 후 페이드인)
      if (t > 1.0) {
        const sa = Math.min(255, Math.floor((t - 1.0) / 0.4 * 255));
        const ah = sa.toString(16).padStart(2, '0');
        renderer.drawText('RECORD  SAVED  TO  LOCAL  STORAGE', W / 2, 165,
          { fontSize: 4, color: `#44ff88${ah}`, align: 'center' });
      }
    }

    // ── 도달 스테이지 ─────────────────────────────────────────────────────
    if (t > 0.9) {
      const a  = Math.min(255, Math.floor((t - 0.9) / 0.35 * 255));
      const ah = a.toString(16).padStart(2, '0');
      const stageY = this._newRecord ? 177 : 159;
      renderer.drawText(`STAGE  ${this._finalStage}  REACHED`, W / 2, stageY,
        { fontSize: 5, color: `#aaaaaa${ah}`, align: 'center' });
    }

    // ── 구분선 ────────────────────────────────────────────────────────────
    renderer.fillRect(W / 2 - 44, 186, 88, 1, '#333333');

    // ── 버튼 안내 ─────────────────────────────────────────────────────────
    if (this._waiting) {
      const blink = Math.floor(t * 1.8) % 2 === 0;
      if (blink) {
        renderer.drawText('[R]  RETRY', W / 2, 193,
          { fontSize: 6, color: '#44ff88', align: 'center' });
        renderer.drawText('[SPACE]  TITLE', W / 2, 205,
          { fontSize: 6, color: '#88aaff', align: 'center' });
      }
    }

    // ── 신기록 진입 플래시 오버레이 ────────────────────────────────────────
    if (this._flashAlpha > 0) {
      const fa = Math.floor(this._flashAlpha * 180).toString(16).padStart(2, '0');
      renderer.fillRect(0, 0, W, H, `#ffcc00${fa}`);
    }
  }

  // ── 랭크 배지 (좌상단 30×26) ──────────────────────────────────────────
  _drawRankBadge(renderer, t) {
    const anim = Math.min(1, (t - 0.15) / 0.4);
    const bx   = 5;
    const by   = 5;
    const bw   = 30;
    const bh   = 26;
    const rCol = RANK_COLOR[this._rank]  ?? '#ffffff';
    const sBa  = Math.floor(anim * 160).toString(16).padStart(2, '0');
    const tBa  = Math.floor(anim * 255).toString(16).padStart(2, '0');

    // 배지 배경 + 테두리
    renderer.fillRect(bx,      by,      bw,     bh,     `#000000${sBa}`);
    renderer.fillRect(bx,      by,      bw,     1,      rCol + sBa); // 상
    renderer.fillRect(bx,      by + bh, bw,     1,      rCol + sBa); // 하
    renderer.fillRect(bx,      by,      1,      bh + 1, rCol + sBa); // 좌
    renderer.fillRect(bx + bw, by,      1,      bh + 1, rCol + sBa); // 우

    // "RANK" 라벨
    renderer.drawText('RANK', bx + bw / 2, by + 3,
      { fontSize: 4, color: `#666666${tBa}`, align: 'center' });

    // 랭크 글자 (큰 글자, 드롭 섀도 포함)
    const shadowCol = RANK_SHADOW[this._rank] ?? '#333333';
    renderer.drawText(this._rank, bx + bw / 2 + 1, by + 10,
      { fontSize: 12, color: shadowCol + tBa, align: 'center' });
    renderer.drawText(this._rank, bx + bw / 2, by + 9,
      { fontSize: 12, color: rCol + tBa, align: 'center' });

    // S 랭크 특별 깜빡임 (금빛 글로우)
    if (this._rank === 'S' && Math.floor(t * 3) % 2 === 0) {
      renderer.drawText(this._rank, bx + bw / 2, by + 9,
        { fontSize: 12, color: '#ffffff66', align: 'center' });
    }
  }
}
