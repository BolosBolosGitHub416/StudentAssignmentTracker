import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

process.env.JWT_SECRET = "test-only-secret";
process.env.USER_STORE_FILE = join(tmpdir(), `student-assignment-tracker-users-${process.pid}.json`);

const [{ default: app }, { assignments }, { users }, { generateToken }] = await Promise.all([
  import("./app.js"),
  import("./models/assignments.js"),
  import("./models/users.js"),
  import("./middleware/auth.js"),
]);

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  rmSync(process.env.USER_STORE_FILE, { force: true });
});

beforeEach(() => {
  assignments.length = 0;
  users.length = 0;
});

test("health route reports API status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "Student Assignment Tracker API",
  });
});

test("registration validates required fields", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student@example.com" }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Missing required registration fields",
  });
});

test("registration stores a user and returns a token without the password", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "Student",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(typeof body.token, "string");
  assert.equal(body.user.email, "student@example.com");
  assert.equal("password" in body.user, false);
  assert.equal(users.length, 1);

  const { users: reloadedUsers } = await import(`./models/users.js?reload=${Date.now()}`);
  assert.equal(reloadedUsers[0].email, "student@example.com");
  assert.equal(reloadedUsers[0].password, users[0].password);

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: " STUDENT@example.com ",
      password: "password123",
    }),
  });
  assert.equal(loginResponse.status, 200);
  assert.equal(typeof (await loginResponse.json()).token, "string");
});

test("assignment routes reject requests without an authorization token", async () => {
  const response = await fetch(`${baseUrl}/api/assignments`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Authorization token required",
  });
});

test("assignment route creates and lists an assignment for a teacher", async () => {
  const token = generateToken({
    _id: "teacher-1",
    email: "teacher@example.com",
    role: "teacher",
  });
  const createResponse = await fetch(`${baseUrl}/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Project",
      studentId: "student-1",
      dueDate: "2026-11-01",
    }),
  });
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.title, "Project");

  const listResponse = await fetch(`${baseUrl}/api/assignments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [created]);
});

test("students can create assignments owned by their authenticated user", async () => {
  const token = generateToken({
    _id: "student-1",
    email: "student@example.com",
    role: "student",
  });
  const createResponse = await fetch(`${baseUrl}/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Lab report",
      course: "Biology 101",
      weight: 20,
      dueDate: "2026-11-01",
      status: "in_progress",
      grade: 95,
      userId: "another-student",
      studentId: "another-student",
    }),
  });
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.course, "Biology 101");
  assert.equal(created.weight, 20);
  assert.equal(created.status, "in_progress");
  assert.equal(created.grade, 95);
  assert.equal(created.userId, "student-1");
  assert.equal(created.studentId, "student-1");

  const listResponse = await fetch(`${baseUrl}/api/assignments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [created]);
});

test("student assignment validation rejects invalid weights and grades", async () => {
  const token = generateToken({
    _id: "student-1",
    email: "student@example.com",
    role: "student",
  });

  for (const invalidField of ["weight", "grade"]) {
    const response = await fetch(`${baseUrl}/api/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Lab report",
        dueDate: "2026-11-01",
        [invalidField]: 101,
      }),
    });

    assert.equal(response.status, 400);
  }
});

test("analytics dashboard returns metrics for the authenticated student's assignments", async () => {
  const userId = "student-analytics";
  const token = generateToken({
    _id: userId,
    email: "analytics@example.com",
    role: "student",
  });
  assignments.push({
    id: "assignment-analytics",
    title: "Lab report",
    course: "Biology 101",
    dueDate: "2026-11-01",
    weight: 20,
    grade: 88,
    status: "completed",
    studentId: userId,
  });

  const response = await fetch(`${baseUrl}/api/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dashboard = await response.json();

  assert.equal(response.status, 200);
  assert.equal(dashboard.totalAssignments, 1);
  assert.equal(dashboard.completedAssignments, 1);
  assert.equal(dashboard.totalCourses, 1);
  assert.equal(dashboard.courses[0].courseName, "Biology 101");
  assert.equal(dashboard.courses[0].gpa.percentage, 88);
});
