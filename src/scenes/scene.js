/**
 * Base Scene class.
 * All scenes implement enter / update / render / exit.
 */
export class Scene {
  constructor(game) {
    this.game = game;
  }

  // Called when transitioning INTO this scene
  enter() {}

  // Called every frame; dt = seconds since last frame
  update(dt) {}

  // Called every frame to draw
  render(renderer) {}

  // Called when transitioning AWAY from this scene
  exit() {}
}
