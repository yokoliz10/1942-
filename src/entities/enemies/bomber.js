import { Enemy } from './enemy.js';
import { BOMBER_SCORE } from '../../config.js';
import { BULLET_OWNER } from '../bullet.js';

export class Bomber extends Enemy {
  constructor() {
    super(24, 18);
    this.maxHp      = 5;
    this.hp         = 5;
    this.scoreValue = BOMBER_SCORE;
    this.fireRate   = 2.0;
    this._fireTimer = 1.0;
  }

  spawn(x, y) {
    super.spawn(x, y);
    this.vy = 35;
    this.vx = 0;
  }

  _shoot(bulletPool) {
    // Spread shot: 3 bullets
    const angles = [Math.PI / 2 - 0.3, Math.PI / 2, Math.PI / 2 + 0.3];
    for (const angle of angles) {
      const b = bulletPool.get();
      if (b) b.fire(this.cx - 1.5, this.y + this.height, BULLET_OWNER.ENEMY, angle);
    }
  }

  _draw(renderer) {
    const { x, y } = this;

    // ── G4M 베티 폭격기 픽셀아트 ─────────────────────────────────────────
    // 날개 그림자
    renderer.fillRect(x,      y + 5,  24, 8,  '#2a1a08');
    // 날개 몸체
    renderer.fillRect(x + 1,  y + 5,  22, 7,  '#4a3418');
    renderer.fillRect(x + 2,  y + 5,  20, 1,  '#6a5430'); // 앞전 하이라이트
    renderer.fillRect(x + 3,  y + 11, 18, 1,  '#2a1a08'); // 후연 그림자

    // 좌 외측 엔진 나셀
    renderer.fillRect(x + 1,  y + 4,  4,  9,  '#2a1808');
    renderer.fillRect(x + 1,  y + 5,  1,  7,  '#4a3020'); // 하이라이트
    // 좌 내측 엔진 나셀
    renderer.fillRect(x + 7,  y + 4,  4,  8,  '#2a1808');
    renderer.fillRect(x + 7,  y + 5,  1,  6,  '#4a3020');
    // 우 내측 엔진 나셀
    renderer.fillRect(x + 13, y + 4,  4,  8,  '#2a1808');
    renderer.fillRect(x + 13, y + 5,  1,  6,  '#4a3020');
    // 우 외측 엔진 나셀
    renderer.fillRect(x + 19, y + 4,  4,  9,  '#2a1808');
    renderer.fillRect(x + 19, y + 5,  1,  7,  '#4a3020');

    // 프로펠러 디스크 (4개)
    renderer.fillRect(x + 1,  y + 3,  4, 1, '#777755');
    renderer.fillRect(x + 7,  y + 3,  4, 1, '#777755');
    renderer.fillRect(x + 13, y + 3,  4, 1, '#777755');
    renderer.fillRect(x + 19, y + 3,  4, 1, '#777755');

    // 동체
    renderer.fillRect(x + 9,  y + 0,  6, 16, '#5a4028');
    renderer.fillRect(x + 9,  y + 0,  1, 14, '#7a6048'); // 좌 하이라이트
    renderer.fillRect(x + 14, y + 0,  1, 14, '#3a2818'); // 우 그림자

    // 온실 유리 기수 (Glass nose)
    renderer.fillRect(x + 10, y + 0,  4,  1,  '#3a2810'); // 기수 끝
    renderer.fillRect(x + 10, y + 1,  4,  3,  '#ffcc88'); // 유리
    renderer.fillRect(x + 10, y + 1,  1,  2,  '#ffeebb'); // 반사광

    // 폭탄창
    renderer.fillRect(x + 10, y + 11, 4,  4,  '#1a0808');
    renderer.fillRect(x + 11, y + 12, 2,  2,  '#442222'); // 창문

    // 꼬리
    renderer.fillRect(x + 9,  y + 15, 6,  2,  '#3a2818');
    renderer.fillRect(x + 7,  y + 16, 10, 1,  '#4a3828'); // 수평 미익
  }
}
