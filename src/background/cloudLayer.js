import { NATIVE_WIDTH, NATIVE_HEIGHT, SCALE } from '../config.js';

/**
 * Cloud layer with parallax scrolling.
 * Two layers at different speeds give a sense of depth.
 */
export class CloudLayer {
  constructor(speed = 20, opacity = 0.6, density = 12, cloudColor = '#e8eaf0') {
    this._speed      = speed;
    this._opacity    = opacity;
    this._cloudColor = cloudColor;
    this._clouds     = this._generateClouds(density);
    this._offset     = 0;
  }

  _generateClouds(count) {
    const clouds = [];
    const rng    = this._rng(count * 17 + 3);
    for (let i = 0; i < count; i++) {
      clouds.push({
        x:     rng() * NATIVE_WIDTH,
        y:     rng() * NATIVE_HEIGHT * 3,
        w:     20 + rng() * 40,
        h:     8  + rng() * 14,
        alpha: 0.3 + rng() * 0.5,
      });
    }
    return clouds;
  }

  _rng(seed) {
    let s = seed | 0;
    return () => {
      s = Math.imul(s, 1664525) + 1013904223 | 0;
      return (s >>> 0) / 0xffffffff;
    };
  }

  update(dt, masterOffset) {
    this._offset = masterOffset * (this._speed / 40);
  }

  render(renderer) {
    const scrollH = NATIVE_HEIGHT * 3;
    const ctx     = renderer.context;

    ctx.save();
    ctx.globalAlpha = this._opacity;

    for (const c of this._clouds) {
      const cy = ((c.y - this._offset % scrollH) % scrollH + scrollH) % scrollH - 20;
      if (cy > NATIVE_HEIGHT + 20) continue;

      const alpha = c.alpha;
      ctx.globalAlpha = alpha * this._opacity;

      // Fluffy cloud shape using overlapping ellipses
      const scale = SCALE;
      ctx.fillStyle = this._cloudColor;
      ctx.beginPath();
      ctx.ellipse(
        (c.x + c.w * 0.3) * scale, cy * scale,
        (c.w * 0.4) * scale, (c.h * 0.5) * scale,
        0, 0, Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        (c.x + c.w * 0.7) * scale, (cy + c.h * 0.1) * scale,
        (c.w * 0.35) * scale, (c.h * 0.45) * scale,
        0, 0, Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        (c.x + c.w * 0.5) * scale, (cy + c.h * 0.15) * scale,
        (c.w * 0.5) * scale, (c.h * 0.6) * scale,
        0, 0, Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }
}
