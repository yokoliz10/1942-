/**
 * Generic Object Pool — prevents GC pressure from frequent allocations.
 *
 * Usage:
 *   const pool = new PoolManager(() => new Bullet(), 64);
 *   const b    = pool.get();    // returns an inactive instance
 *   b.fire(...);
 *   // later:
 *   pool.release(b);            // manually return (or let active=false do it)
 */
export class PoolManager {
  constructor(factory, initialSize = 32) {
    this._factory  = factory;
    this._pool     = [];
    this._active   = [];

    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.active = false;
      this._pool.push(obj);
    }
  }

  // Get an inactive object from the pool (or create a new one if empty)
  get() {
    for (const obj of this._pool) {
      if (!obj.active) return obj;
    }
    // Pool exhausted — grow it
    const obj = this._factory();
    obj.active = false;
    this._pool.push(obj);
    return obj;
  }

  // Return all pool objects (active and inactive)
  getAll() { return this._pool; }

  // Return only currently active objects
  getActive() { return this._pool.filter(o => o.active); }

  // Release an object back to the pool
  release(obj) { obj.active = false; }

  // Release all active objects
  releaseAll() { this._pool.forEach(o => (o.active = false)); }

  get size()       { return this._pool.length; }
  get activeCount(){ return this._pool.filter(o => o.active).length; }
}
