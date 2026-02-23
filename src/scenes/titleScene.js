import { Scene }   from './scene.js';
import { NATIVE_WIDTH, NATIVE_HEIGHT } from '../config.js';

// ── 1942 픽셀아트 로고 (5×7 도트 매트릭스) ──────────────────────────────────
// 비트 4=열0(좌), 비트 0=열4(우)
const LOGO_BITS = {
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
};

const DW   = 4;            // 도트 너비 (native px)
const DH   = 5;            // 도트 높이 (native px)
const CW   = 5 * DW;       // 글자 너비  = 20
const CH   = 7 * DH;       // 글자 높이  = 35
const CGAP = 6;            // 글자 간격
const LOGO_W = 4 * CW + 3 * CGAP;   // = 98
const LOGO_X = Math.floor((NATIVE_WIDTH - LOGO_W) / 2);  // = 63
const LOGO_Y = 8;

// ── 데모 편대 ───────────────────────────────────────────────────────────────
// V자 5기 편대가 화면 위에서 아래로 흘러내려옴
class DemoFormation {
  constructor() {
    this.y      = -30 - Math.random() * 20;
    this.cx     = 35 + Math.random() * (NATIVE_WIDTH - 70);
    this.vy     = 30 + Math.random() * 18;
    this.t      = 0;
    this.active = true;
  }

  update(dt) {
    this.t += dt;
    this.y += this.vy * dt;
    if (this.y > NATIVE_HEIGHT + 24) this.active = false;
  }

  render(renderer) {
    // [dx, dy] V자 편대 오프셋
    const slots = [[0, 0], [-18, 8], [18, 8], [-36, 16], [36, 16]];
    for (const [dx, dy] of slots) {
      this._drawFighter(renderer,
        Math.round(this.cx + dx - 7),
        Math.round(this.y  + dy));
    }
  }

  _drawFighter(renderer, x, y) {
    renderer.fillRect(x + 5, y,      4, 2, '#3a4a10'); // 기수
    renderer.fillRect(x + 4, y + 2,  6, 4, '#1a4a1a'); // 동체
    renderer.fillRect(x,     y + 3, 14, 2, '#1e5a1e'); // 날개
    renderer.fillRect(x + 5, y + 6,  4, 2, '#143414'); // 꼬리
    renderer.fillRect(x + 2, y + 4,  2, 2, '#cc1111'); // 좌 히노마루
    renderer.fillRect(x + 10,y + 4,  2, 2, '#cc1111'); // 우 히노마루
  }
}

export class TitleScene extends Scene {
  constructor(game) {
    super(game);
    this._t          = 0;
    this._formations = [];
    this._nextWave   = 0;
    this._stars      = [];
    this._demoX      = -20;
  }

  enter() {
    this._t          = 0;
    this._formations = [];
    this._nextWave   = 1.2;
    this._demoX      = -20;

    // 스크롤 별장 (매 프레임 아래로 이동)
    this._stars = Array.from({ length: 80 }, () => ({
      x:  Math.random() * NATIVE_WIDTH,
      y:  Math.random() * NATIVE_HEIGHT,
      vy: 12 + Math.random() * 30,
      sz: Math.random() < 0.18 ? 2 : 1,
      b:  0.25 + Math.random() * 0.75,
    }));

    this.game.soundManager?.play('bgm_title');
  }

  update(dt) {
    this._t += dt;
    const input = this.game.input;
    if (input.isPressed('Space') || input.isPressed('Enter') || input.isPressed('KeyZ')) {
      this.game.soundManager?.resume();
      this.game.soundManager?.stopBGM();
      this.game.switchScene('game');
    }

    // 별 스크롤
    for (const s of this._stars) {
      s.y += s.vy * dt;
      if (s.y > NATIVE_HEIGHT + 2) { s.y = -2; s.x = Math.random() * NATIVE_WIDTH; }
    }

    // 데모 편대 관리
    this._nextWave -= dt;
    if (this._nextWave <= 0) {
      this._formations.push(new DemoFormation());
      this._nextWave = 3.8 + Math.random() * 2.5;
    }
    for (const f of this._formations) f.update(dt);
    this._formations = this._formations.filter(f => f.active);

    // 데모 P-38 (화면 아래쪽을 천천히 횡단)
    this._demoX += 32 * dt;
    if (this._demoX > NATIVE_WIDTH + 20) this._demoX = -20;
  }

  render(renderer) {
    const W = NATIVE_WIDTH;
    const H = NATIVE_HEIGHT;
    const t = this._t;

    // ── 배경 ──────────────────────────────────────────────────────────────
    renderer.fillRect(0, 0, W, H, '#050512');

    // 스크롤 별
    for (const s of this._stars) {
      const a = Math.floor(s.b * 200).toString(16).padStart(2, '0');
      renderer.fillRect(Math.floor(s.x), Math.floor(s.y), s.sz, s.sz, `#c0d0ff${a}`);
    }

    // 해양 지평선 (하단)
    renderer.fillRect(0, H - 26, W, 2,  '#081c3c');
    renderer.fillRect(0, H - 24, W, 8,  '#0a2250');
    renderer.fillRect(0, H - 16, W, 16, '#091e44');
    // 파도 반짝임
    for (let i = 0; i < 6; i++) {
      const wx = (i * 38 + Math.floor(t * 16)) % W;
      renderer.fillRect(wx, H - 20 + (i % 3), 4, 1, '#2866aa33');
    }

    // ── 데모 편대 ──────────────────────────────────────────────────────────
    for (const f of this._formations) f.render(renderer);

    // ── 1942 픽셀아트 로고 ────────────────────────────────────────────────
    this._drawLogo(renderer, t);

    // ── 부제목 (로고 아래) ─────────────────────────────────────────────────
    if (t > 0.3) {
      const a  = Math.min(255, Math.floor((t - 0.3) / 0.4 * 255));
      const ah = a.toString(16).padStart(2, '0');
      renderer.drawText('PACIFIC  AIR  WAR', W / 2, LOGO_Y + CH + 5, {
        fontSize: 6, color: `#bb7755${ah}`, align: 'center',
      });
      // 구분선 (서서히 확장)
      const lw = Math.floor((a / 255) * (W - 36));
      renderer.fillRect(Math.floor((W - lw) / 2), LOGO_Y + CH + 14, lw, 1, `#55331a${ah}`);
    }

    // ── HI-SCORE 패널 ──────────────────────────────────────────────────────
    const panelY = LOGO_Y + CH + 20; // ≈ 63
    if (t > 0.55) {
      const a  = Math.min(255, Math.floor((t - 0.55) / 0.4 * 255));
      const ah = a.toString(16).padStart(2, '0');
      const hi = this.game.scoreManager.hiscore;

      renderer.drawText('HI-SCORE', W / 2, panelY, {
        fontSize: 5, color: `#ccaa44${ah}`, align: 'center',
      });
      renderer.drawText(String(hi).padStart(8, '0'), W / 2, panelY + 9, {
        fontSize: 8, color: `#ffee44${ah}`, align: 'center',
      });
      renderer.fillRect(W / 2 - 54, panelY + 20, 108, 1, `#443322${ah}`);
    }

    // ── PRESS ENTER TO START (깜빡임) ─────────────────────────────────────
    const blinkY = panelY + 29; // ≈ 92
    if (t > 0.9 && Math.floor(t * 1.5) % 2 === 0) {
      renderer.drawText('PRESS  ENTER  TO  START', W / 2, blinkY, {
        fontSize: 6, color: '#ffff33', align: 'center',
      });
    }

    // ── 조작키 안내 ────────────────────────────────────────────────────────
    const ctrlY = blinkY + 16; // ≈ 108
    if (t > 1.1) {
      const a  = Math.min(255, Math.floor((t - 1.1) / 0.6 * 255));
      const ah = a.toString(16).padStart(2, '0');
      renderer.fillRect(W / 2 - 54, ctrlY - 3, 108, 1, `#1e2233${ah}`);
      const lines = [
        ['MOVE', 'ARROW / WASD'],
        ['FIRE', 'SPACE'],
        ['LOOP', 'Z / SHIFT'],
        ['MUTE', 'M'],
      ];
      for (let i = 0; i < lines.length; i++) {
        const [key, val] = lines[i];
        const ly = ctrlY + i * 9;
        renderer.drawText(key, W / 2 - 5, ly,
          { fontSize: 5, color: `#7788aa${ah}`, align: 'right' });
        renderer.drawText(`:  ${val}`, W / 2 - 3, ly,
          { fontSize: 5, color: `#99aacc${ah}`, align: 'left' });
      }
    }

    // ── 데모 P-38 ─────────────────────────────────────────────────────────
    this._drawDemoPlayer(renderer, Math.floor(this._demoX) - 8, H - 42);

    // ── 저작권 ────────────────────────────────────────────────────────────
    if (t > 1.8) {
      renderer.drawText(
        '© 1984  CAPCOM  CO., LTD.     RECREATION PROJECT',
        W / 2, H - 7, { fontSize: 4, color: '#333344', align: 'center' },
      );
    }
  }

  // ── 1942 픽셀아트 로고 렌더 ────────────────────────────────────────────
  _drawLogo(renderer, t) {
    for (let ci = 0; ci < 4; ci++) {
      const ch   = '1942'[ci];
      const bits = LOGO_BITS[ch];
      if (!bits) continue;

      // 글자마다 약간의 슬라이드-인 딜레이
      const charT  = Math.max(0, Math.min(1, (t - ci * 0.07) / 0.28));
      const slideY = (1 - charT) * -52;

      const cx = LOGO_X + ci * (CW + CGAP);
      const cy = LOGO_Y + slideY;

      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (!(bits[row] & (1 << (4 - col)))) continue;

          const px = cx + col * DW;
          const py = cy + row * DH;

          // 드롭 섀도 (우하 +2)
          renderer.fillRect(px + 2, py + 2, DW, DH, '#1a0000');

          // 세로 그라디언트: 상단=밝은 빨강, 중단=기본 빨강, 하단=주황
          const color = row <= 1  ? '#ff4444'
                      : row <= 4  ? '#dd2020'
                      :             '#cc3300';
          renderer.fillRect(px, py, DW, DH, color);

          // 최상단 행에 흰 하이라이트 1px
          if (row === 0) {
            renderer.fillRect(px, py, DW, 1, '#ff9988');
          }
        }
      }
    }
  }

  // ── 데모 P-38 실루엣 (16×14) ──────────────────────────────────────────
  _drawDemoPlayer(renderer, x, y) {
    renderer.fillRect(x + 1,  y + 3,  3, 1, '#7a9a7a'); // 좌 프롭 디스크
    renderer.fillRect(x + 12, y + 3,  3, 1, '#7a9a7a'); // 우 프롭 디스크
    renderer.fillRect(x + 1,  y + 4,  3, 8, '#4a7030'); // 좌 붐
    renderer.fillRect(x + 12, y + 4,  3, 8, '#4a7030'); // 우 붐
    renderer.fillRect(x,      y + 6, 16, 4, '#5a8838'); // 주익
    renderer.fillRect(x + 1,  y + 6, 14, 1, '#88bb54'); // 날개 앞전 하이라이트
    renderer.fillRect(x + 6,  y,      4,13, '#6a9c40'); // 중앙 동체
    renderer.fillRect(x + 7,  y,      2, 1, '#1a2808'); // 기수 끝
    renderer.fillRect(x + 6,  y + 2,  4, 3, '#44aaee'); // 조종석
    renderer.fillRect(x + 6,  y + 2,  1, 2, '#88ddff'); // 반사광
    renderer.fillRect(x + 3,  y + 12,10, 1, '#5a8838'); // 수평미익
  }
}
