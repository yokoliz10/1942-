import { Entity } from './entity.js';
import {
  PLAYER_SPEED, PLAYER_SPEED_BOOST, PLAYER_MAX_SPEED_LV,
  PLAYER_FIRE_RATE, PLAYER_LOOP_DURATION, PLAYER_LOOP_USES,
  NATIVE_WIDTH, NATIVE_HEIGHT, SCALE,
} from '../config.js';
import { BULLET_OWNER } from './bullet.js';

const STATE = { NORMAL: 'normal', LOOP: 'loop', DEAD: 'dead', RESPAWN: 'respawn' };

// weapon types
export const WEAPON = { SINGLE: 'single', DOUBLE: 'double', SHOTGUN: 'shotgun' };

export class Player extends Entity {
  constructor() {
    super(NATIVE_WIDTH / 2 - 8, NATIVE_HEIGHT - 40, 16, 16);
    this._state        = STATE.NORMAL;
    this._fireTimer    = 0;
    this._loopTimer    = 0;
    this._respawnTimer = 0;

    this.loopUses      = PLAYER_LOOP_USES; // uses remaining this stage

    this.lives      = 3;
    this.weaponType = WEAPON.SINGLE;  // 'single' | 'double' | 'shotgun'
    this.speedLevel = 0;              // 0‥PLAYER_MAX_SPEED_LV

    this._invincible      = false;
    this._invincibleTimer = 0;

    this._t       = 0;
    this._bankDir = 0;
  }

  get isLooping()    { return this._state === STATE.LOOP; }
  get isInvincible() { return this._invincible; }
  get _speed()       { return PLAYER_SPEED + this.speedLevel * PLAYER_SPEED_BOOST; }

  update(dt, input, bulletPool, soundManager) {
    this._t += dt;

    if (this._state === STATE.DEAD) return;

    if (this._state === STATE.RESPAWN) {
      this._respawnTimer    -= dt;
      this._invincibleTimer -= dt;
      if (this._respawnTimer    <= 0) {
        this._state = STATE.NORMAL;
        this.x = NATIVE_WIDTH / 2 - this.width / 2;
        this.y = NATIVE_HEIGHT - 40;
      }
      if (this._invincibleTimer <= 0) this._invincible = false;
      return;
    }

    if (this._state === STATE.LOOP) {
      this._loopTimer -= dt;
      if (this._loopTimer <= 0) {
        this._state      = STATE.NORMAL;
        this._invincible = false;
      }
      return; // 루프 중 조작 불가
    }

    // ── 이동 ──────────────────────────────────────────────────────────────
    let dx = 0, dy = 0;
    if (input.left  || input.touchDX < 0) dx -= this._speed;
    if (input.right || input.touchDX > 0) dx += this._speed;
    if (input.up    || input.touchDY < 0) dy -= this._speed;
    if (input.down  || input.touchDY > 0) dy += this._speed;

    this._bankDir = Math.sign(dx);
    this.x = Math.max(0, Math.min(NATIVE_WIDTH  - this.width,  this.x + dx * dt));
    this.y = Math.max(0, Math.min(NATIVE_HEIGHT - this.height, this.y + dy * dt));

    // ── 루프 기동 ─────────────────────────────────────────────────────────
    if (input.loop && this.loopUses > 0) {
      this._startLoop(soundManager);
    }

    // ── 발사 ──────────────────────────────────────────────────────────────
    this._fireTimer -= dt;
    if (input.fire && this._fireTimer <= 0) {
      this._fire(bulletPool, soundManager);
      this._fireTimer = PLAYER_FIRE_RATE;
    }

    // ── 무적 카운트다운 ───────────────────────────────────────────────────
    if (this._invincible && this._invincibleTimer > 0) {
      this._invincibleTimer -= dt;
      if (this._invincibleTimer <= 0) this._invincible = false;
    }
  }

  _startLoop(soundManager) {
    this._state      = STATE.LOOP;
    this._loopTimer  = PLAYER_LOOP_DURATION;
    this._invincible = true;
    this.loopUses--;
    soundManager?.play('loop');
  }

  _fire(bulletPool, soundManager) {
    for (const shot of this._getShotList()) {
      const b = bulletPool.get();
      if (b) b.fire(shot.x, shot.y, BULLET_OWNER.PLAYER, shot.angle);
    }
    soundManager?.play('shoot');
  }

  _getShotList() {
    const cx = this.cx - 1.5;
    const ty = this.y - 4;

    switch (this.weaponType) {
      case WEAPON.DOUBLE:
        // 두 줄 직진탄
        return [
          { x: cx - 5, y: ty,     angle: -Math.PI / 2 },
          { x: cx + 5, y: ty,     angle: -Math.PI / 2 },
        ];

      case WEAPON.SHOTGUN:
        // 5방향 산탄 — 중앙 + 좌우 × 2
        return [
          { x: cx,     y: ty,     angle: -Math.PI / 2 },
          { x: cx - 3, y: ty + 2, angle: -Math.PI / 2 - 0.28 },
          { x: cx + 3, y: ty + 2, angle: -Math.PI / 2 + 0.28 },
          { x: cx - 5, y: ty + 4, angle: -Math.PI / 2 - 0.52 },
          { x: cx + 5, y: ty + 4, angle: -Math.PI / 2 + 0.52 },
        ];

      default: // SINGLE
        return [{ x: cx, y: ty, angle: -Math.PI / 2 }];
    }
  }

  hit() {
    if (this._invincible || this._state === STATE.LOOP) return false;
    this.lives--;
    if (this.lives <= 0) {
      this._state = STATE.DEAD;
    } else {
      this._state           = STATE.RESPAWN;
      this._respawnTimer    = 1.5;
      this._invincible      = true;
      this._invincibleTimer = 3.0;
      this.weaponType = WEAPON.SINGLE; // 사망 시 무기 초기화
      this.speedLevel = 0;
    }
    return true;
  }

  // ── 렌더링 ──────────────────────────────────────────────────────────────

  render(renderer) {
    if (this._state === STATE.DEAD) return;

    // 부활 / 무적 깜빡임
    if (this._state === STATE.RESPAWN && Math.floor(this._t * 10) % 2 === 0) return;
    if (this._invincible && this._state === STATE.NORMAL && Math.floor(this._t * 8) % 2 === 0) return;

    if (this._state === STATE.LOOP) {
      this._renderLoop(renderer);
      return;
    }

    this._drawPlane(renderer);
  }

  _drawPlane(renderer) {
    const { x, y } = this;

    // ── P-38 Lightning 픽셀아트 ───────────────────────────────────────────
    // 프로펠러 디스크 (붐 앞 회전 잔상)
    renderer.fillRect(x + 1,  y + 2,  3, 1, '#99bb99'); // 좌 프롭
    renderer.fillRect(x + 12, y + 2,  3, 1, '#99bb99'); // 우 프롭

    // 엔진 나셀 (붐 상단)
    renderer.fillRect(x + 1,  y + 3,  3, 2, '#2a4018'); // 좌 나셀
    renderer.fillRect(x + 12, y + 3,  3, 2, '#2a4018'); // 우 나셀

    // 쌍 붐 (좌)
    renderer.fillRect(x + 1,  y + 3, 3, 10, '#5a8030'); // 붐 몸체
    renderer.fillRect(x + 1,  y + 4, 1,  8, '#8ab050'); // 붐 하이라이트
    renderer.fillRect(x + 2,  y + 12, 2, 2, '#3a5022'); // 꼬리 핀

    // 쌍 붐 (우)
    renderer.fillRect(x + 12, y + 3,  3, 10, '#5a8030');
    renderer.fillRect(x + 14, y + 4,  1,  8, '#8ab050');
    renderer.fillRect(x + 12, y + 12, 2,  2, '#3a5022');

    // 날개
    renderer.fillRect(x,      y + 5, 16, 5, '#6a9a3a'); // 날개 몸체
    renderer.fillRect(x + 1,  y + 5, 14, 1, '#9ac85a'); // 앞전 하이라이트
    renderer.fillRect(x + 3,  y + 9, 10, 1, '#4a6a2a'); // 후연 그림자

    // 중앙 동체
    renderer.fillRect(x + 6,  y + 0, 4, 14, '#7aaa4a'); // 동체
    renderer.fillRect(x + 6,  y + 0, 1, 12, '#a0ca6a'); // 좌측 하이라이트
    renderer.fillRect(x + 9,  y + 0, 1, 12, '#4a6a2a'); // 우측 그림자

    // 기수 (프롭 허브)
    renderer.fillRect(x + 7,  y + 0, 2,  1, '#1a2a0a'); // 기수 끝
    renderer.fillRect(x + 6,  y + 1, 4,  2, '#2a3a14'); // 기수 몸체

    // 조종석 캐노피
    renderer.fillRect(x + 6,  y + 3, 4,  3, '#44bbff'); // 유리
    renderer.fillRect(x + 6,  y + 3, 1,  2, '#aaddff'); // 반사광
    renderer.fillRect(x + 7,  y + 5, 2,  1, '#1a2c08'); // 캐노피 프레임

    // 수평 미익
    renderer.fillRect(x + 3,  y + 13, 10, 1, '#6a9a3a');

    // 무기 파워업 색상 줄
    const weaponTint = { double: '#00ddff', shotgun: '#ff8822', single: null }[this.weaponType];
    if (weaponTint) renderer.fillRect(x + 4, y + 7, 8, 1, weaponTint);

    // 뱅크 기울기 하이라이트
    if (this._bankDir !== 0) {
      renderer.fillRect(this._bankDir < 0 ? x : x + 10, y + 6, 6, 1, '#b0cc70');
    }
  }

  // ── 루프 기동 애니메이션 ────────────────────────────────────────────────
  // 수직 축 회전(barrel roll): scaleY가 1→0→-1→0→1 으로 변화하며
  // 0° = 정방향, 90° = edge-on(날개 안 보임), 180° = 뒤집힘, 270° = edge-on 복귀
  _renderLoop(renderer) {
    const progress  = 1 - this._loopTimer / PLAYER_LOOP_DURATION; // 0 → 1
    const rollAngle = progress * Math.PI * 2;
    const scaleY    = Math.cos(rollAngle);     // 1 → 0 → -1 → 0 → 1
    const { x, y, width, height } = this;
    const S   = SCALE;
    const ctx = renderer.context;

    // 잔상 트레일 (3개 반투명 줄)
    for (let i = 1; i <= 3; i++) {
      ctx.save();
      ctx.globalAlpha = 0.12 * (4 - i);
      ctx.fillStyle   = '#6699ff';
      ctx.fillRect((x + 3) * S, (y + i * 4) * S, (width - 6) * S, 2 * S);
      ctx.restore();
    }

    // 메인 기체 (scaleY 압축)
    ctx.save();
    ctx.translate((x + width / 2) * S, (y + height / 2) * S);
    ctx.scale(1, Math.abs(scaleY) + 0.07);

    const isInverted = scaleY < 0;
    // 반전 순간 (progress ≈ 0.5) 백색 플래시
    const flash     = Math.max(0, 1 - Math.abs(progress - 0.5) * 10);
    const bodyColor = flash > 0.3
      ? '#ffffff'
      : isInverted ? '#aaccff' : '#c8c8c8';
    const wingColor = flash > 0.3
      ? '#ffffff'
      : isInverted ? '#8899cc' : '#b0b0e0';
    const boomColor = isInverted ? '#7788aa' : '#a0a0a0';

    const hw = (width  / 2) * S;
    const hh = (height / 2) * S;

    // 동체
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-2 * S, -hh + 2 * S, 4 * S, height * S - 4 * S);
    // 날개
    ctx.fillStyle = wingColor;
    ctx.fillRect(-hw, -1 * S, width * S, 4 * S);
    // 붐 (쌍동)
    ctx.fillStyle = boomColor;
    ctx.fillRect(-hw + S,      -2 * S, 3 * S, 7 * S);
    ctx.fillRect(hw - 4 * S,   -2 * S, 3 * S, 7 * S);
    // 조종석
    ctx.fillStyle = flash > 0.3 ? '#ffffff' : '#88ccff';
    ctx.fillRect(-S, -hh + 2 * S, 2 * S, 3 * S);

    ctx.restore();

    // 무적 글로우 링
    ctx.save();
    ctx.strokeStyle = `rgba(80,160,255,${0.35 + 0.35 * Math.sin(progress * Math.PI * 10)})`;
    ctx.lineWidth   = S * 1.5;
    ctx.beginPath();
    ctx.ellipse(
      (x + width  / 2) * S,
      (y + height / 2) * S,
      (width  / 2 + 5) * S,
      (height / 2 + 5) * S,
      0, 0, Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }

}
