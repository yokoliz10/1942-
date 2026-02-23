import { Entity } from './entity.js';
import { NATIVE_HEIGHT } from '../config.js';

export const POWERUP_TYPE = {
  DOUBLE:     'double',     // 더블샷  — 2열 직진탄
  SHOTGUN:    'shotgun',    // 샷건    — 5방향 산탄
  SPEED:      'speed',      // 속도업  — 이동 속도 증가
  EXTRA_LIFE: 'extra_life', // 잔기 추가
  BOMB:       'bomb',       // 전체 폭탄
};

const META = {
  double:     { color: '#00eeff', label: 'D',   desc: 'DOUBLE' },
  shotgun:    { color: '#ff8800', label: 'S',   desc: 'SHOTGUN' },
  speed:      { color: '#44ff88', label: '▶▶', desc: 'SPEED' },
  extra_life: { color: '#ff44ff', label: '1UP', desc: '1UP' },
  bomb:       { color: '#ff6600', label: 'B',   desc: 'BOMB' },
};

// Drop probability weights (must sum to 1)
const DROP_WEIGHTS = [
  { type: POWERUP_TYPE.DOUBLE,     w: 0.30 },
  { type: POWERUP_TYPE.SHOTGUN,    w: 0.30 },
  { type: POWERUP_TYPE.SPEED,      w: 0.20 },
  { type: POWERUP_TYPE.EXTRA_LIFE, w: 0.10 },
  { type: POWERUP_TYPE.BOMB,       w: 0.10 },
];

export function randomPowerupType() {
  let r = Math.random();
  for (const { type, w } of DROP_WEIGHTS) {
    r -= w;
    if (r <= 0) return type;
  }
  return POWERUP_TYPE.DOUBLE;
}

export class Powerup extends Entity {
  constructor() {
    super(0, 0, 14, 14);
    this.type   = POWERUP_TYPE.DOUBLE;
    this.active = false;
    this._t     = 0;
  }

  spawn(x, y, type) {
    this.x      = x - this.width / 2;
    this.y      = y;
    this.type   = type;
    this.active = true;
    this.vy     = 38;
    this._t     = 0;
  }

  update(dt) {
    if (!this.active) return;
    this._t += dt;
    super.update(dt);
    if (this.y > NATIVE_HEIGHT + 20) this.active = false;
  }

  render(renderer) {
    if (!this.active) return;
    const meta  = META[this.type] ?? META.double;
    const pulse = 0.65 + 0.35 * Math.sin(this._t * 7);
    const al    = Math.floor(pulse * 255).toString(16).padStart(2, '0');
    const c     = meta.color;
    const { x, y, width: W, height: H } = this;

    // ── 아이템 박스 테두리 ─────────────────────────────────────────────────
    renderer.fillRect(x,         y,         W,     H,     '#000000' + al); // 배경
    renderer.fillRect(x + 1,     y,         W - 2, 1,     c + al); // 상단
    renderer.fillRect(x + 1,     y + H - 1, W - 2, 1,     c + al); // 하단
    renderer.fillRect(x,         y + 1,     1,     H - 2, c + al); // 좌
    renderer.fillRect(x + W - 1, y + 1,     1,     H - 2, c + al); // 우
    // 코너 포인트
    renderer.fillRect(x + 1, y + 1,     1, 1, c + al);
    renderer.fillRect(x + W - 2, y + 1,     1, 1, c + al);
    renderer.fillRect(x + 1, y + H - 2, 1, 1, c + al);
    renderer.fillRect(x + W - 2, y + H - 2, 1, 1, c + al);

    // ── 타입별 픽셀 아이콘 (10×10, 오프셋 x+2, y+2) ─────────────────────
    const ix = x + 2;
    const iy = y + 2;

    switch (this.type) {
      case POWERUP_TYPE.DOUBLE:
        // ↑↑ 이중 화살표
        renderer.fillRect(ix + 1, iy,     2, 8, c + al);
        renderer.fillRect(ix + 5, iy,     2, 8, c + al);
        renderer.fillRect(ix,     iy,     4, 2, c + al); // 좌 화살촉
        renderer.fillRect(ix + 4, iy,     4, 2, c + al); // 우 화살촉
        break;

      case POWERUP_TYPE.SHOTGUN:
        // 산탄 부채꼴
        renderer.fillRect(ix + 4, iy,     2, 6, c + al); // 중앙
        renderer.fillRect(ix + 1, iy + 2, 2, 4, c + al); // 좌
        renderer.fillRect(ix + 7, iy + 2, 2, 4, c + al); // 우
        renderer.fillRect(ix,     iy + 6, 2, 2, '#ffffff' + al); // 극좌 탄
        renderer.fillRect(ix + 4, iy + 7, 2, 2, '#ffffff' + al); // 중앙 탄
        renderer.fillRect(ix + 8, iy + 6, 2, 2, '#ffffff' + al); // 극우 탄
        break;

      case POWERUP_TYPE.SPEED:
        // >> 이중 쐐기
        renderer.fillRect(ix,     iy + 2, 1, 6, c + al);
        renderer.fillRect(ix + 1, iy + 1, 1, 8, c + al);
        renderer.fillRect(ix + 2, iy + 2, 1, 6, c + al);
        renderer.fillRect(ix + 4, iy + 2, 1, 6, c + al);
        renderer.fillRect(ix + 5, iy + 1, 1, 8, c + al);
        renderer.fillRect(ix + 6, iy + 2, 1, 6, c + al);
        // 속도선
        renderer.fillRect(ix + 1, iy + 9, 8, 1, c + al);
        break;

      case POWERUP_TYPE.EXTRA_LIFE:
        // 미니 P-38 실루엣
        renderer.fillRect(ix + 4, iy,     2, 9, c + al); // 동체
        renderer.fillRect(ix,     iy + 3, 10, 3, c + al); // 날개
        renderer.fillRect(ix + 1, iy + 8, 8,  1, c + al); // 미익
        renderer.fillRect(ix + 1, iy + 3, 2,  6, '#ffffff88'); // 좌 붐
        renderer.fillRect(ix + 7, iy + 3, 2,  6, '#ffffff88'); // 우 붐
        renderer.fillRect(ix + 4, iy + 1, 2,  2, '#ffffff' + al); // 조종석
        break;

      case POWERUP_TYPE.BOMB:
        // 둥근 폭탄
        renderer.fillRect(ix + 3, iy,     4, 1, c + al);
        renderer.fillRect(ix + 1, iy + 1, 8, 2, c + al);
        renderer.fillRect(ix,     iy + 3, 10, 3, c + al);
        renderer.fillRect(ix + 1, iy + 6, 8,  2, c + al);
        renderer.fillRect(ix + 3, iy + 8, 4,  1, c + al);
        renderer.fillRect(ix + 5, iy + 0, 1,  1, '#ffcc44' + al); // 도화선 접합
        renderer.fillRect(ix + 4, iy,     2,  1, '#ffffff88');     // 광택
        break;
    }
  }
}
