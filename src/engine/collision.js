/**
 * Axis-Aligned Bounding Box collision detection.
 * All coordinates are in native (un-scaled) pixels.
 */

// Returns true if two AABB rectangles overlap
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Returns true if point (px, py) is inside rect r {x,y,w,h}
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Check entity vs entity (entities expose x, y, width, height)
export function entitiesOverlap(a, b) {
  return aabbOverlap(
    { x: a.x, y: a.y, w: a.width,  h: a.height },
    { x: b.x, y: b.y, w: b.width,  h: b.height },
  );
}

// Check a list of bullets against a list of targets
// Calls onHit(bullet, target) for each collision pair
// Returns number of hits detected
export function checkBulletsVsTargets(bullets, targets, onHit) {
  let hits = 0;
  for (const bullet of bullets) {
    if (!bullet.active) continue;
    for (const target of targets) {
      if (!target.active) continue;
      if (entitiesOverlap(bullet, target)) {
        onHit(bullet, target);
        hits++;
      }
    }
  }
  return hits;
}
