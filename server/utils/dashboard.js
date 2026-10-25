// server/utils/dashboard.js
// turn a students assignments into the response shapes the React dashboard expects using the logic in analytics.js.
import {
  calculateWeightedAverage,
  calculateCourseGPA,
  calculateCumulativeGPA,
  predictGrade,
  prioritizeAssignments,
  detectRisks,
  analyzePerformanceTrend,
  getTrendDirection,
  gradeToGPA,
  gradeToLetter,
} from './analytics.js';

const isGraded = (a) => a.grade !== null && a.grade !== undefined;
const RANK = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export const groupByCourse = (assignments) => {
  const map = {};
  for (const a of assignments) {
    const key = a.course || 'Uncategorized';
    (map[key] ||= []).push(a);
  }
  return map;
};

export const buildCourseSnapshot = (courseName, list) => {
  const { average, gpa, letter } = calculateCourseGPA(list);
  const graded = list.filter(isGraded);
  const remaining = list.filter((a) => !isGraded(a));
const gradedWeight = graded.reduce(
  (total, a) => total + (Number(a.weight) || 0),
  0
);

const remainingWeight = Math.max(0, 100 - gradedWeight);

const ungradedWeight = remaining.reduce(
  (total, a) => total + (Number(a.weight) || 0),
  0
);

const unplannedWeight = Math.max(0, remainingWeight - ungradedWeight);

const predictionRemaining = [
  ...remaining,
  ...(unplannedWeight > 0
    ? [{ title: "Unplanned coursework", weight: unplannedWeight }]
    : [])
];

const p = predictGrade(graded, predictionRemaining);  const sumWeight = (items) => items.reduce((s, a) => s + (a.weight || 0), 0);

  const predicted = p.projectedFinal ?? 0;
  const risks = detectRisks({ assignments: list, courses: [{ name: courseName, assignments: list }] });
  const riskLevel = risks.reduce((max, r) => (RANK[r.level] > RANK[max] ? r.level : max), 'NONE');

  const recommendations = [];
  if (risks.some((r) => r.type === 'OVERDUE_ASSIGNMENTS')) recommendations.push('Submit overdue work first to limit the grade impact.');
  if (risks.some((r) => r.type === 'HIGH_WEIGHT_DEADLINE')) recommendations.push('Focus on the high-weight deadline coming up in the next 48 hours.');
  if (Number.isFinite(p.requiredAverage) && p.requiredAverage > 0 && p.requiredAverage <= 100 && remaining.length > 0) {
    recommendations.push(`You need about ${p.requiredAverage}% on the remaining work to finish at 70%.`);
  }
  if (recommendations.length === 0) recommendations.push('Keep up your current pace on the remaining assignments.');

  const points = analyzePerformanceTrend(list);
  const { direction, delta } = getTrendDirection(points);
  const trendData = points.map((pt, i) => ({
    title: pt.title,
    grade: pt.grade,
    trend: i === 0 ? 'stable' : pt.grade > points[i - 1].grade ? 'improving' : pt.grade < points[i - 1].grade ? 'declining' : 'stable',
  }));
  const summary = points.length === 0
    ? 'No graded assignments yet.'
    : direction === 'insufficient_data'
      ? `${points.length} graded assignment${points.length > 1 ? 's' : ''} so far. Add more to see a trend.`
      : `Overall trend: ${direction} (${delta > 0 ? '+' : ''}${delta} points).`;

  return {
    courseName,
    gpa: { gpa, percentage: average ?? 0, letterGrade: letter, totalWeight: sumWeight(graded) },
    prediction: {
      predicted,
      bestCase: p.scenario?.optimistic ?? 0,
      worstCase: p.scenario?.pessimistic ?? 0,
      predictedLetter: p.projectedFinal === null ? null : gradeToLetter(predicted),
remainingWeight,
      completedWeight: sumWeight(graded),
    },
    risk: { riskLevel, alerts: risks.map((r) => r.message), recommendations },
    trends: { summary, trendData },
  };
};

// runing GPA after each graded assignment (oldest to newest) for the GPA trend line
export const buildGpaTrend = (assignments) => {
  const graded = assignments
    .filter((a) => isGraded(a) && a.weight)
    .sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate));
  return graded.map((a, i) => {
    const average = calculateWeightedAverage(graded.slice(0, i + 1));
    return { date: a.dueDate, title: a.title, average, gpa: gradeToGPA(average) };
  });
};

export const buildPriorityList = (assignments, limit = 5) =>
  prioritizeAssignments(assignments)
    .filter((a) => a.status !== 'completed')
    .slice(0, limit)
    .map((a) => ({ ...a, priority: a.priorityLabel }));

export const buildDashboard = (assignments) => {
  const grouped = groupByCourse(assignments);
  const courses = Object.entries(grouped).map(([name, list]) => buildCourseSnapshot(name, list));
  const cumulativeGPA = calculateCumulativeGPA(
    Object.entries(grouped).map(([courseName, list]) => ({ courseName, assignments: list }))
  );
  const completed = assignments.filter((a) => a.status === 'completed').length;

  return {
    cumulativeGPA,
    courses,
    gpaTrend: buildGpaTrend(assignments),
    upcomingPriority: buildPriorityList(assignments, 5),
    totalAssignments: assignments.length,
    completedAssignments: completed,
    pendingAssignments: assignments.length - completed,
    totalCourses: courses.length,
  };
};
