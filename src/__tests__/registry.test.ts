import { describe, expect, it } from 'vitest';
import { APPS, INTERNAL_APPS, PUBLIC_APPS } from '../registry/apps';

describe('App Registry', () => {
  it('contains all 12 unique apps without duplicate ids, slugs, or paths', () => {
    expect(APPS).toHaveLength(12);
    expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length);
    expect(new Set(APPS.map((a) => a.slug)).size).toBe(APPS.length);
    expect(new Set(APPS.map((a) => a.path)).size).toBe(APPS.length);
  });

  it('enforces route prefixes by visibility and runtime requirements', () => {
    for (const app of PUBLIC_APPS) {
      expect(app.path.startsWith('/apps/')).toBe(true);
    }
    for (const app of INTERNAL_APPS) {
      expect(app.path.startsWith('/internal/')).toBe(true);
    }
    for (const app of APPS) {
      if (app.runtime === 'react') {
        expect(app.component).toBeDefined();
      } else {
        expect(app.legacySrc?.startsWith('/legacy/')).toBe(true);
      }
    }
  });
});
