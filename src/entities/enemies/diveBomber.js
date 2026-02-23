import { Enemy } from './enemy.js';
import { DIVE_BOMBER_SCORE, NATIVE_HEIGHT } from '../../config.js';
import { BULLET_OWNER } from '../bullet.js';

const PHASE = { ENTRY: 'entry', DIVE: 'dive', RETREAT: 'retreat' };

export class DiveBomber extends Enemy {
  constructor() {
    super(16, 14);
    this.maxHp      = 2;
    this.hp         = 2;
    this.scoreValue = DIVE_BOMBER_SCORE;
    this.fireRate   = 0; // manual fire in _move
    this._phase     = PHASE.ENTRY;
    this._targetX   = 0;
    this._targetY   = 0;
  }

  spawn(x, y, targetX, targetY) {
    super.spawn(x, y);
    this._phase   = PHASE.ENTRY;
    this._targetX = targetX;
    this._targetY = targetY;
    this.vy = 50;
    this.vx = 0;
  }

  _move(dt) {
    switch (this._phase) {
      case PHASE.ENTRY:
        this.y += this.vy * dt;
        if (this.y > 40) {
          this._phase = PHASE.DIVE;
          // Aim toward target
          const dx = this._targetX - this.x;
          const dy = this._targetY - this.y;
          const len = Math.hypot(dx, dy) || 1;
          const speed = 120;
          this.vx = (dx / len) * speed;
          this.vy = (dy / len) * speed;
        }
        break;

      case PHASE.DIVE:
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y > NATIVE_HEIGHT * 0.7 || this._t > 2.5) {
          this._phase = PHASE.RETREAT;
          this.vy = -80;
          this.vx *= 0.3;
        }
        break;

      case PHASE.RETREAT:
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        break;
    }
  }

  _draw(renderer) {
    const { x, y } = this;
    const isDiving = this._phase === 'dive';

    // ── D3A 밸 급강하폭격기 픽셀아트 ─────────────────────────────────────
    // 급강하 시 엔진 카울 발광
    const cowlColor = isDiving ? '#cc3300' : '#281408';
    const cowlHL    = isDiving ? '#ff6633' : '#3a2010';

    // 엔진 카울
    renderer.fillRect(x + 5,  y + 0, 6, 1, '#141008'); // 프롭 허브
    renderer.fillRect(x + 4,  y + 1, 8, 3, cowlColor); // 카울 링
    renderer.fillRect(x + 5,  y + 1, 6, 2, cowlHL);    // 카울 하이라이트

    // 동체
    renderer.fillRect(x + 5,  y + 0, 6, 13, '#7a4520');
    renderer.fillRect(x + 5,  y + 1, 1, 11, '#9a6540'); // 좌 하이라이트
    renderer.fillRect(x + 10, y + 1, 1, 11, '#5a3510'); // 우 그림자

    // 날개
    renderer.fillRect(x,      y + 4, 16, 5,  '#5a3518');
    renderer.fillRect(x + 1,  y + 4, 14, 1,  '#7a5538'); // 앞전
    renderer.fillRect(x + 2,  y + 8, 12, 1,  '#3a2210'); // 후연 그림자

    // 고정식 랜딩기어 (밸의 특징)
    renderer.fillRect(x + 3,  y + 8,  2, 4, '#281808'); // 좌 스트럿
    renderer.fillRect(x + 2,  y + 11, 4, 1, '#3a2810'); // 좌 휠 페어링
    renderer.fillRect(x + 11, y + 8,  2, 4, '#281808'); // 우 스트럿
    renderer.fillRect(x + 10, y + 11, 4, 1, '#3a2810'); // 우 휠 페어링

    // 조종석
    renderer.fillRect(x + 6,  y + 2, 4, 4, '#ffcc44');
    renderer.fillRect(x + 6,  y + 2, 1, 3, '#ffee88'); // 반사광

    // 꼬리
    renderer.fillRect(x + 6,  y + 11, 4, 2, '#4a2c10');
    renderer.fillRect(x + 4,  y + 12, 8, 1, '#5a3c20'); // 수평 미익
  }
}
