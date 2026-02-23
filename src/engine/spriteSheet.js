/**
 * SpriteSheet — loads an image and slices it into named frames.
 *
 * Usage:
 *   const sheet = new SpriteSheet('assets/images/player.png');
 *   await sheet.load();
 *   sheet.define('idle',    { x:0,  y:0,  w:16, h:16 });
 *   sheet.define('banking', { x:16, y:0,  w:16, h:16 });
 *   renderer.drawSprite(sheet.image, ...sheet.get('idle'), destX, destY);
 */
export class SpriteSheet {
  constructor(src) {
    this.src    = src;
    this.image  = null;
    this._frames = new Map();
  }

  load() {
    return new Promise((resolve, reject) => {
      const img  = new Image();
      img.onload  = () => { this.image = img; resolve(this); };
      img.onerror = () => {
        // Create a 1×1 placeholder so the game doesn't crash on missing assets
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        this.image = c;
        resolve(this);
      };
      img.src = this.src;
    });
  }

  // Define a named frame: { x, y, w, h } in source pixels
  define(name, rect) {
    this._frames.set(name, rect);
  }

  // Returns [sx, sy, sw, sh] suitable for renderer.drawSprite
  get(name) {
    const f = this._frames.get(name);
    if (!f) throw new Error(`SpriteSheet: unknown frame "${name}"`);
    return [f.x, f.y, f.w, f.h];
  }

  has(name) { return this._frames.has(name); }
}
