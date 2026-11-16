import { describe, expect, it } from 'vitest';
import {
  calculateWeightedAverage,
  gradeToGPA,
  gradeToLetter,
  predictGrade,
} from '../../server/utils/analytics.js';

describe('grade analytics', () => {
  it('maps grade thresholds to GPA points and letters', () => {
    expect(gradeToGPA(89.9)).toBe(3.7);
    expect(gradeToLetter(89.9)).toBe('A');
    expect(gradeToLetter(50)).toBe('D');
    expect(gradeToLetter(49.9)).toBe('F');
  });

  it('calculates the weighted average using only graded, weighted assignments', () => {
    expect(
      calculateWeightedAverage([
        { grade: 80, weight: 25 },
        { grade: 100, weight: 75 },
        { grade: 20, weight: 0 },
        { grade: null, weight: 100 },
      ]),
    ).toBe(95);
    expect(calculateWeightedAverage([{ grade: null, weight: 100 }])).toBeNull();
  });

  it('predicts course results from completed and remaining work', () => {
    expect(
      predictGrade(
        [{ grade: 80, weight: 40 }],
        [{ weight: 60 }],
        70,
      ),
    ).toMatchObject({
      currentAverage: 80,
      projectedFinal: 80,
      requiredAverage: 63.33,
      completionPercent: 40,
      isAchievable: true,
    });
  });
});
