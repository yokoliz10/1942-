import { Entity } from './entity.js';
import { NATIVE_HEIGHT, PLAYER_BULLET_SPEED, ENEMY_BULLET_SPEED } from '../config.js';

export const BULLET_OWNER = { PLAYER: 'player', ENEMY: 'enemy' };

export class Bullet extends Entity {
  constructor() {
    super(0, 0, 3, 8);
    this.owner  = BULLET_OWNER.PLAYER;
    this.damage = 1;
    this.active = false;
  }

  fire(x, y, owner = BULLET_OWNER.PLAYER, angle = -Math.PI / 2, damage = 1) {
    this.x      = x;
    this.y      = y;
    this.owner  = owner;
    this.damage = damage;
    this.active = true;

    const speed = owner === BULLET_OWNER.PLAYER ? PLAYER_BULLET_SPEED : ENEMY_BULLET_SPEED;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    if (!this.active) return;
    super.update(dt);
    // Deactivate when off screen
    if (this.y + this.height < 0 || this.y > NATIVE_HEIGHT + 10 ||
        this.x + this.width  < 0 || this.x > 224 + 10) {
      this.active = false;
    }
  }

  render(renderer) {
    if (!this.active) return;

    if (this.owner === BULLET_OWNER.PLAYER) {
      // ── 플레이어 예광탄 ─────────────────────────────────────────────────
      renderer.fillRect(this.x,       this.y,     3, 1, '#ffffff'); // 탄두 끝
      renderer.fillRect(this.x,       this.y + 1, 3, 3, '#ffff88'); // 탄두 상단
      renderer.fillRect(this.x + 0.5, this.y + 2, 2, 2, '#ffffff'); // 광채 코어
      renderer.fillRect(this.x,       this.y + 4, 3, 3, '#ffcc44'); // 탄체 하단
      renderer.fillRect(this.x + 0.5, this.y + 7, 2, 1, '#ff8800'); // 테일 글로우
    } else {
      // ── 적 탄환 (붉은 구슬) ─────────────────────────────────────────────
      renderer.fillRect(this.x + 0.5, this.y,     2, 1, '#ff6666'); // 상단
      renderer.fillRect(this.x,       this.y + 1, 3, 6, '#ff2222'); // 몸체
      renderer.fillRect(this.x + 0.5, this.y + 2, 2, 4, '#ff6644'); // 내부 코어
      renderer.fillRect(this.x + 0.5, this.y + 7, 2, 1, '#ff6666'); // 하단
    }
  }
}
