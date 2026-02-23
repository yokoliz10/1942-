import { Entity } from '../entity.js';
import { NATIVE_WIDTH, NATIVE_HEIGHT } from '../../config.js';
import { BULLET_OWNER } from '../bullet.js';

export class Enemy extends Entity {
  constructor(width = 16, height = 16) {
    super(-100, -100, width, height);
    this.active     = false;
    this.hp         = 1;
    this.maxHp      = 1;
    this.scoreValue = 100;
    this._t         = 0;        // local time since spawn
    this._fireTimer = 0;
    this.fireRate   = 0;        // 0 = never fires
  }

  spawn(x, y) {
    this.x             = x;
    this.y             = y;
    this.active        = true;
    this.hp            = this.maxHp;
    this._t            = 0;
    this.formationGroup = null; // 풀 재사용 시 이전 참조 초기화
  }

  update(dt, bulletPool) {
    if (!this.active) return;
    this._t += dt;
    this._move(dt);

    // Off-screen cleanup
    if (this.y > NATIVE_HEIGHT + 30 || this.y < -60 ||
        this.x < -60 || this.x > NATIVE_WIDTH + 60) {
      this.active = false;
      return;
    }

    // Shooting
    if (this.fireRate > 0 && bulletPool) {
      this._fireTimer -= dt;
      if (this._fireTimer <= 0) {
        this._fireTimer = this.fireRate;
        this._shoot(bulletPool);
      }
    }
  }

  // Override in subclasses for movement patterns
  _move(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  _shoot(bulletPool) {
    const b = bulletPool.get();
    if (!b) return;
    // Aim straight down by default
    b.fire(this.cx - 1.5, this.y + this.height, BULLET_OWNER.ENEMY, Math.PI / 2);
  }

  hit(damage = 1) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.active = false;
      return true; // destroyed
    }
    return false;
  }

  render(renderer) {
    if (!this.active) return;
    this._draw(renderer);
  }

  // Subclasses override _draw for appearance
  _draw(renderer) {
    renderer.fillRect(this.x, this.y, this.width, this.height, '#ff4444');
  }
}
