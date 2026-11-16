import { describe, expect, it } from 'vitest';
import { getPriority } from './priority.js';

describe('getPriority', () => {
  it('classifies deadlines at each urgency boundary', () => {
    expect(getPriority(1)).toBe('CRITICAL');
    expect(getPriority(2)).toBe('HIGH');
    expect(getPriority(3)).toBe('HIGH');
    expect(getPriority(4)).toBe('MEDIUM');
  });
});
