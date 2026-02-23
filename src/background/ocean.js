import { NATIVE_WIDTH, NATIVE_HEIGHT, SCALE } from '../config.js';

const TEX_H   = 256;
const WORLD_H = 2400;

// ── 테마 팔레트 (wave + island 색상) ─────────────────────────────────────
const THEME = {
  // Stage 1,4,7… — 맑은 태평양
  day: {
    wave: [
      [ 95, 175, 230], [ 52, 128, 195], [ 22,  82, 158], [ 13,  60, 128],
      [  8,  48, 105], [  8,  48, 105], [ 12,  58, 120], [ 18,  72, 142],
      [ 30,  96, 172], [ 65, 148, 215],
    ],
    reef: '#28c8aa', sand: '#dbbe6a', sand2: '#cead58',
    ground: '#2e7224', tree1: '#1d5018', tree2: '#255c1e',
    treeShades: ['#1a4814','#204e18','#265c1c','#2c6820','#1e5016'],
    lagoon: '#18b8a0', lagoon2: '#30ceb4', veg: '#1e5a18',
    bay: '#1460a0', rock: '#605650',
  },
  // Stage 2,5,8… — 노을빛 산호해
  sunset: {
    wave: [
      [210, 138,  72], [172, 102,  62], [138,  74,  56], [106,  54,  50],
      [ 82,  40,  46], [ 82,  40,  46], [ 92,  48,  50], [112,  64,  58],
      [148,  90,  68], [188, 126,  76],
    ],
    reef: '#38c2a0', sand: '#e8c070', sand2: '#d4a850',
    ground: '#4c6420', tree1: '#384e10', tree2: '#445618',
    treeShades: ['#2c4010','#344814','#3c5018','#44581c','#304610'],
    lagoon: '#20a890', lagoon2: '#32bc8e', veg: '#384810',
    bay: '#1a4e88', rock: '#786048',
  },
  // Stage 3,6,9… — 야간 작전
  night: {
    wave: [
      [ 44,  66,  98], [ 28,  44,  78], [ 16,  28,  60], [ 10,  18,  46],
      [  6,  12,  34], [  6,  12,  34], [  8,  16,  40], [ 12,  22,  50],
      [ 20,  33,  64], [ 34,  52,  84],
    ],
    reef: '#1c3e50', sand: '#4a4038', sand2: '#3e3430',
    ground: '#181c14', tree1: '#101408', tree2: '#181c10',
    treeShades: ['#0c1208','#10160a','#141a0c','#181e10','#0e1208'],
    lagoon: '#0c2838', lagoon2: '#102e42', veg: '#101408',
    bay: '#081828', rock: '#2e2420',
  },
};

export class OceanLayer {
  constructor(theme = 'day') {
    this._c       = THEME[theme] ?? THEME.day;
    this._offset  = 0;
    this._waveTex = this._buildWaveTexture();
    this._islands = this._buildIslands();
  }

  update(dt, masterOffset) {
    this._offset = masterOffset;
  }

  render(renderer) {
    const ctx = renderer.context;
    const S   = SCALE;
    const W   = NATIVE_WIDTH;
    const H   = NATIVE_HEIGHT;

    ctx.imageSmoothingEnabled = false;
    const scrollY = this._offset % TEX_H;
    ctx.drawImage(this._waveTex, 0, 0, W, TEX_H,
                  0, -scrollY * S, W * S, TEX_H * S);
    ctx.drawImage(this._waveTex, 0, 0, W, TEX_H,
                  0, (TEX_H - scrollY) * S, W * S, TEX_H * S);

    const scrollMod = this._offset % WORLD_H;
    for (const isl of this._islands) {
      for (const rawY of [isl.worldY - scrollMod,
                          isl.worldY - scrollMod + WORLD_H]) {
        const top = rawY - isl.h / 2 - isl.margin;
        if (top > H + 4 || top + isl.canvas.height / S + 4 < 0) continue;
        ctx.drawImage(
          isl.canvas,
          0, 0, isl.canvas.width, isl.canvas.height,
          Math.round((isl.x - isl.w / 2 - isl.margin) * S),
          Math.round((rawY  - isl.h / 2 - isl.margin) * S),
          Math.round((isl.w + isl.margin * 2) * S),
          Math.round((isl.h + isl.margin * 2) * S),
        );
      }
    }
  }

  // ── 파도 텍스처 ──────────────────────────────────────────────────────────
  _buildWaveTexture() {
    const W = NATIVE_WIDTH, H = TEX_H;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(W, H);
    const data = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const [r, g, b] = this._wavePixel(x, y);
        const i = (y * W + x) * 4;
        data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  _wavePixel(x, y) {
    const PERIOD = 10;
    const xWave  = Math.sin(x * 0.18) * 1.8 + Math.sin(x * 0.071 + 1.4) * 1.1;
    const row    = ((y + Math.round(xWave)) % PERIOD + PERIOD) % PERIOD;
    const noise  = Math.sin(x * 0.47 + y * 0.23) * 0.5
                 + Math.sin(x * 0.11 - y * 0.37) * 0.5;
    const nv     = Math.round(noise * 5);
    const [r, g, b] = this._c.wave[row] ?? this._c.wave[4];
    return [
      Math.min(255, Math.max(0, r + nv)),
      Math.min(255, Math.max(0, g + nv)),
      Math.min(255, Math.max(0, b + nv)),
    ];
  }

  // ── 섬 생성 ──────────────────────────────────────────────────────────────
  _buildIslands() {
    const rng   = this._rng(42);
    const types = [
      ...Array(6).fill('small'),  ...Array(5).fill('medium'),
      ...Array(3).fill('large'),  ...Array(3).fill('atoll'),
      ...Array(3).fill('landmass'),
    ];
    const islands = [];
    for (let i = 0; i < 24; i++) {
      const type = types[Math.floor(rng() * types.length)];
      const [w, h] = {
        small:    [12 + rng() * 14, 8  + rng() * 10],
        medium:   [28 + rng() * 24, 18 + rng() * 18],
        large:    [56 + rng() * 44, 32 + rng() * 28],
        atoll:    [26 + rng() * 18, 14 + rng() * 12],
        landmass: [90 + rng() * 90, 44 + rng() * 38],
      }[type];
      const margin = 10;
      const halfW  = w / 2 + margin;
      const x      = halfW + rng() * (NATIVE_WIDTH - halfW * 2);
      const worldY = 60 + rng() * (WORLD_H - 120);
      const seed   = Math.floor(rng() * 999983);
      const canvas = this._prerenderIsland(type, w, h, seed, margin);
      islands.push({ worldY, x, w, h, type, margin, canvas });
    }
    return islands;
  }

  _prerenderIsland(type, w, h, seed, margin) {
    const cw = Math.ceil(w) + margin * 2;
    const ch = Math.ceil(h) + margin * 2;
    const cx = cw / 2, cy = ch / 2;
    const rx = w / 2,  ry = h / 2;
    const rng = this._rng(seed);
    const c   = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if      (type === 'atoll')    this._drawAtoll(ctx, cx, cy, rx, ry, rng);
    else if (type === 'landmass') this._drawLandmass(ctx, cx, cy, rx, ry, rng);
    else                          this._drawRegularIsland(ctx, cx, cy, rx, ry, type, rng);
    return c;
  }

  // ── 섬 드로잉 ────────────────────────────────────────────────────────────
  _applyBlobPath(ctx, pts, cx, cy, rx, ry, scale) {
    const N = pts.length;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a  = pts[i];
      const b  = pts[(i + 1) % N];
      const mx = cx + (a.cos + b.cos) / 2 * rx * scale;
      const my = cy + (a.sin + b.sin) / 2 * ry * scale;
      const qx = cx + b.cos * rx * scale;
      const qy = cy + b.sin * ry * scale;
      if (i === 0) ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(qx, qy,
        cx + (b.cos + pts[(i + 2) % N].cos) / 2 * rx * scale,
        cy + (b.sin + pts[(i + 2) % N].sin) / 2 * ry * scale,
      );
    }
    ctx.closePath();
  }

  _makeBlobPts(N, variance, rng) {
    return Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const v = 1 + (rng() - 0.5) * variance * 2;
      return { cos: Math.cos(a) * v, sin: Math.sin(a) * v };
    });
  }

  _drawRegularIsland(ctx, cx, cy, rx, ry, type, rng) {
    const c    = this._c;
    const N    = 10;
    const base = this._makeBlobPts(N, 0.22, rng);
    ctx.fillStyle = c.reef;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.42); ctx.fill();
    ctx.fillStyle = c.sand;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.10); ctx.fill();
    ctx.fillStyle = c.sand2;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.00); ctx.fill();
    ctx.fillStyle = c.ground;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 0.82); ctx.fill();
    const moundCount = type === 'large' ? 4 + Math.floor(rng() * 5)
                     : type === 'medium' ? 2 + Math.floor(rng() * 3)
                     : 1 + Math.floor(rng() * 2);
    for (let m = 0; m < moundCount; m++) {
      const mx = cx + (rng() - 0.5) * rx * 1.0;
      const my = cy + (rng() - 0.5) * ry * 0.7;
      const mr = rx * (0.12 + rng() * 0.26);
      ctx.fillStyle = rng() > 0.5 ? c.tree1 : c.tree2;
      ctx.beginPath();
      ctx.ellipse(mx, my, mr, mr * 0.65, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    if (rng() > 0.55) {
      const rox = cx + (rng() - 0.5) * rx * 0.7;
      const roy = cy + (rng() - 0.5) * ry * 0.5;
      ctx.fillStyle = c.rock;
      ctx.beginPath();
      ctx.ellipse(rox, roy, rx * 0.09 + 1, ry * 0.11 + 1, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawAtoll(ctx, cx, cy, rx, ry, rng) {
    const c    = this._c;
    const N    = 12;
    const base = this._makeBlobPts(N, 0.28, rng);
    ctx.fillStyle = c.reef;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.35); ctx.fill();
    ctx.fillStyle = c.sand;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.08); ctx.fill();
    ctx.fillStyle = c.ground;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 0.85); ctx.fill();
    const lagRx = rx * (0.38 + rng() * 0.14);
    const lagRy = ry * (0.38 + rng() * 0.14);
    ctx.fillStyle = c.lagoon;
    ctx.beginPath();
    ctx.ellipse(cx, cy, lagRx, lagRy, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.lagoon2;
    ctx.beginPath();
    ctx.ellipse(cx - lagRx * 0.25, cy - lagRy * 0.25, lagRx * 0.35, lagRy * 0.3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    for (let v = 0; v < 4; v++) {
      const a  = (v / 4) * Math.PI * 2 + rng() * 0.7;
      const vx = cx + Math.cos(a) * rx * 0.78;
      const vy = cy + Math.sin(a) * ry * 0.78;
      ctx.fillStyle = c.veg;
      ctx.beginPath();
      ctx.ellipse(vx, vy, rx * 0.14, ry * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  _drawLandmass(ctx, cx, cy, rx, ry, rng) {
    const c      = this._c;
    const N      = 14;
    const base   = this._makeBlobPts(N, 0.25, rng);
    ctx.fillStyle = c.reef;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.18); ctx.fill();
    ctx.fillStyle = c.sand;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 1.03); ctx.fill();
    ctx.fillStyle = c.ground;
    this._applyBlobPath(ctx, base, cx, cy, rx, ry, 0.90); ctx.fill();
    const mounds = 5 + Math.floor(rng() * 7);
    for (let m = 0; m < mounds; m++) {
      const mx = cx + (rng() - 0.5) * rx * 1.5;
      const my = cy + (rng() - 0.5) * ry * 1.0;
      const mr = rx * (0.08 + rng() * 0.28);
      ctx.fillStyle = c.treeShades[m % c.treeShades.length];
      ctx.beginPath();
      ctx.ellipse(mx, my, mr, mr * 0.68, rng() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }
    const bayCount = 1 + Math.floor(rng() * 2);
    for (let b = 0; b < bayCount; b++) {
      const angle = rng() * Math.PI;
      const bx    = cx + Math.cos(angle) * rx * 0.55;
      const by    = cy + Math.sin(angle) * ry * 0.40;
      const brx   = rx * (0.12 + rng() * 0.18);
      const bry   = ry * (0.09 + rng() * 0.12);
      ctx.fillStyle = c.bay;
      ctx.beginPath();
      ctx.ellipse(bx, by, brx, bry, angle, 0, Math.PI * 2); ctx.fill();
    }
    for (let r2 = 0; r2 < 3; r2++) {
      const a   = rng() * Math.PI * 2;
      const rr  = 0.88 + rng() * 0.15;
      const rox = cx + Math.cos(a) * rx * rr;
      const roy = cy + Math.sin(a) * ry * rr;
      ctx.fillStyle = c.rock;
      ctx.beginPath();
      ctx.ellipse(rox, roy, 2 + rng() * 3, 1.5 + rng() * 2, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 유틸 ─────────────────────────────────────────────────────────────────
  _rng(seed) {
    let s = seed | 0;
    return () => {
      s = Math.imul(s, 1664525) + 1013904223 | 0;
      return (s >>> 0) / 0xffffffff;
    };
  }
}
