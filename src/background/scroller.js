import { NATIVE_WIDTH, NATIVE_HEIGHT, SCROLL_SPEED } from '../config.js';

/**
 * Vertical scroller engine.
 * Manages multiple layers that scroll at different speeds (parallax).
 */
export class Scroller {
  constructor() {
    this._layers  = [];
    this.offset   = 0;       // master scroll offset (increases over time)
    this._speed   = SCROLL_SPEED;
  }

  addLayer(layer) {
    this._layers.push(layer);
    return this;
  }

  update(dt) {
    this.offset += this._speed * dt;
    for (const layer of this._layers) {
      layer.update(dt, this.offset);
    }
  }

  render(renderer) {
    for (const layer of this._layers) {
      layer.render(renderer);
    }
  }

  setSpeed(s) { this._speed = s; }
}
