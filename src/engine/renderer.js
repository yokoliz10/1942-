import { CANVAS_WIDTH, CANVAS_HEIGHT, SCALE } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    canvas.width  = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Crisp pixel rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Draw a sprite region from an image
  // sx,sy,sw,sh  — source rect on the sprite sheet (native pixels)
  // dx,dy,dw,dh  — destination rect on the canvas (scaled pixels)
  drawSprite(image, sx, sy, sw, sh, dx, dy, dw = sw * SCALE, dh = sh * SCALE) {
    this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  // Draw a solid rectangle (native coords → auto-scaled)
  fillRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
  }

  // strokeRect in native coords
  strokeRect(x, y, w, h, color, lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = lineWidth;
    this.ctx.strokeRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
  }

  // Text in native coords
  drawText(text, x, y, options = {}) {
    const {
      color    = '#fff',
      fontSize = 8,
      align    = 'left',
      baseline = 'top',
      font     = 'monospace',
    } = options;

    this.ctx.fillStyle    = color;
    this.ctx.font         = `${fontSize * SCALE}px ${font}`;
    this.ctx.textAlign    = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x * SCALE, y * SCALE);
  }

  // Draw a filled circle (native coords)
  fillCircle(x, y, r, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x * SCALE, y * SCALE, r * SCALE, 0, Math.PI * 2);
    this.ctx.fill();
  }

  save()    { this.ctx.save(); }
  restore() { this.ctx.restore(); }

  // Translate/rotate using native coords
  translate(x, y) { this.ctx.translate(x * SCALE, y * SCALE); }
  rotate(angle)   { this.ctx.rotate(angle); }

  get context() { return this.ctx; }
}
