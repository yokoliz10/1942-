import { Enemy } from './enemy.js';
import { FIGHTER_SCORE, NATIVE_WIDTH } from '../../config.js';

export class Fighter extends Enemy {
  constructor() {
    super(14, 12);
    this.maxHp      = 1;
    this.hp         = 1;
    this.scoreValue = FIGHTER_SCORE;
    this.fireRate   = 3.5;
    this._fireTimer = 1.5;

    this._pattern   = 'straight';
    this._amplitude = 20;
    this._freq      = 2;
    this._baseX     = 0;
  }

  spawn(x, y, pattern = 'straight') {
    super.spawn(x, y);
    this._pattern = pattern;
    this._baseX   = x;

    switch (pattern) {
      // ── 좌측 곡선 진입: 화면 왼쪽 바깥에서 우하향 호를 그리며 진입 ────
      case 'swoop_left':
        this.vx =  95;   // 초기: 빠르게 오른쪽
        this.vy =  35;   // 초기: 천천히 아래
        break;

      // ── 우측 곡선 진입: 화면 오른쪽 바깥에서 좌하향 호 ───────────────
      case 'swoop_right':
        this.vx = -95;
        this.vy =  35;
        break;

      // ── 종대(column) / 직선 기본 ──────────────────────────────────────
      default:
        this.vx =  0;
        this.vy = 60;
        break;
    }
  }

  _move(dt) {
    switch (this._pattern) {
      // 사인 파동 — x를 baseX 기준 sin으로, y는 등속
      case 'sine':
        this.y += this.vy * dt;
        this.x  = this._baseX + Math.sin(this._t * this._freq) * this._amplitude;
        break;

      // 급강하 — 좌우로 한 번 뱅크 후 직진
      case 'dive':
        this.y  += this.vy * dt;
        this.vx += (this._t < 1.0 ? 45 : -45) * dt;
        this.x  += this.vx * dt;
        break;

      // 좌측 곡선 — 수평 감속 + 수직 가속 → 90° 호
      case 'swoop_left':
        this.vx  = Math.max(0, this.vx - 42 * dt);
        this.vy  = Math.min(85, this.vy + 22 * dt);
        this.x  += this.vx * dt;
        this.y  += this.vy * dt;
        break;

      // 우측 곡선 — 수평 감속(좌→0) + 수직 가속
      case 'swoop_right':
        this.vx  = Math.min(0, this.vx + 42 * dt);
        this.vy  = Math.min(85, this.vy + 22 * dt);
        this.x  += this.vx * dt;
        this.y  += this.vy * dt;
        break;

      // 직선 / 종대 기본
      default:
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        break;
    }
  }

  _draw(renderer) {
    const { x, y } = this;
    const isSwoop = this._pattern === 'swoop_left' || this._pattern === 'swoop_right';
    const isDive  = this._pattern === 'dive';

    // ── 3종 제로센 픽셀아트 ────────────────────────────────────────────────
    // 타입별 색상 팔레트
    //  기본(straight/sine): A6M 제로 — 녹색 위장
    //  dive:               D3 요격기  — 진한 남색
    //  swoop:              함재기     — 황갈색
    const c = isDive
      ? { body: '#2a2a6a', wing: '#3a3a8a', hl: '#5a5aaa', nose: '#14142a', ckpt: '#aa88ff', mark: '#9933dd', tail: '#1e1e48' }
      : isSwoop
      ? { body: '#5a3a10', wing: '#7a5528', hl: '#a07844', nose: '#301c06', ckpt: '#ffdd44', mark: '#ff6600', tail: '#3c2808' }
      : { body: '#1a4a1a', wing: '#286628', hl: '#4a8a4a', nose: '#0e2c0e', ckpt: '#ffdd88', mark: '#cc1111', tail: '#143414' };

    // 엔진 카울 (기수)
    renderer.fillRect(x + 4,  y + 0, 6, 1, c.nose); // 카울 최선단
    renderer.fillRect(x + 3,  y + 1, 8, 2, c.nose); // 카울 몸체
    renderer.fillRect(x + 4,  y + 1, 6, 1, c.body); // 카울 내측

    // 동체
    renderer.fillRect(x + 5,  y + 0, 4, 10, c.body); // 동체 몸체
    renderer.fillRect(x + 5,  y + 1, 1,  8, c.hl);   // 좌 하이라이트
    renderer.fillRect(x + 8,  y + 1, 1,  8, c.tail); // 우 그림자

    // 날개
    renderer.fillRect(x,      y + 3, 14, 4, c.wing); // 날개 몸체
    renderer.fillRect(x + 1,  y + 3, 12, 1, c.hl);   // 앞전
    renderer.fillRect(x + 2,  y + 6, 10, 1, c.tail); // 후연 그림자

    // 조종석
    renderer.fillRect(x + 5,  y + 2, 4, 3, c.ckpt);    // 캐노피
    renderer.fillRect(x + 5,  y + 2, 1, 2, '#ffffff');  // 반사광

    // 날개 마킹 (히노마루 / 타입별 기장)
    renderer.fillRect(x + 1,  y + 4, 2, 2, c.mark); // 좌익
    renderer.fillRect(x + 11, y + 4, 2, 2, c.mark); // 우익

    // 꼬리
    renderer.fillRect(x + 5,  y + 9,  4, 2, c.tail); // 꼬리 몸체
    renderer.fillRect(x + 3,  y + 10, 8, 1, c.wing); // 수평 미익
  }
}
