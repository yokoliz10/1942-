/**
 * Base Entity — all game objects inherit from this.
 * Coordinates are in native (un-scaled) pixels.
 */
export class Entity {
  constructor(x = 0, y = 0, width = 8, height = 8) {
    this.x      = x;
    this.y      = y;
    this.width  = width;
    this.height = height;
    this.active = true;    // false → will be removed / returned to pool
    this.vx     = 0;       // velocity x (pixels/sec)
    this.vy     = 0;       // velocity y (pixels/sec)
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  // Override in subclasses
  render(renderer) {}

  // Centre position helpers
  get cx() { return this.x + this.width  / 2; }
  get cy() { return this.y + this.height / 2; }

  // Returns AABB rect object (native pixels)
  get bounds() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  reset(x, y) {
    this.x      = x;
    this.y      = y;
    this.vx     = 0;
    this.vy     = 0;
    this.active = true;
  }
}
