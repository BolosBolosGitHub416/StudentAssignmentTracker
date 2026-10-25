// server/app.test.js
// Uses an in-memory MongoDB so tests run without a local MongoDB install

import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import process from 'node:process';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from './app.js';
import { connectDB, disconnectDB } from './utils/db.js';
import './utils/models.js';

process.env.JWT_SECRET = 'test-only-secret-for-unit-tests';
process.env.NODE_ENV = 'test';

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDB(process.env.MONGODB_URI);
});

after(async () => {
  await disconnectDB();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// —— Health ——
test('health route reports API status', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    status: 'ok',
    service: 'Student Assignment Tracker API',
  });
  rmSync(process.env.USER_STORE_FILE, { force: true });
});

// —— Auth validation ——
test('registration validates required fields', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'student@example.com' });

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('registration stores a user and returns a token without the password', async () => {
  const res = await request(app).post('/api/auth/register').send({
    email: 'student@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'Student',
  });

  assert.equal(res.status, 201);
  assert.equal(typeof res.body.token, 'string');
  assert.equal(res.body.user.email, 'student@example.com');
  assert.equal('password' in res.body.user, false);
});

test('login rejects invalid credentials', async () => {
  await request(app).post('/api/auth/register').send({
    email: 'login@example.com',
    password: 'password123',
    firstName: 'Log',
    lastName: 'In',
  });

  const res = await request(app).post('/api/auth/login').send({
    email: 'login@example.com',
    password: 'wrong-password',
  });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Invalid credentials');
});

test('login succeeds with correct credentials', async () => {
  await request(app).post('/api/auth/register').send({
    email: 'ok@example.com',
    password: 'password123',
    firstName: 'Ok',
    lastName: 'User',
  });

  const res = await request(app).post('/api/auth/login').send({
    email: 'ok@example.com',
    password: 'password123',
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'ok@example.com');
});

// —— Assignment auth ——
test('assignment routes reject requests without an authorization token', async () => {
  const res = await request(app).get('/api/assignments');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Authorization token required');
});

test('student can create and list their own assignment', async () => {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'student2@example.com',
    password: 'password123',
    firstName: 'Stu',
    lastName: 'Dent',
    role: 'student',
  });
  const token = reg.body.token;

  const createRes = await request(app)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Lab 1',
      dueDate: '2026-11-01',
      course: 'CPAN212',
      weight: 10,
    });

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.title, 'Lab 1');
  assert.ok(createRes.body.id);

  const listRes = await request(app)
    .get('/api/assignments')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listRes.status, 200);
  assert.equal(listRes.body.length, 1);
  assert.equal(listRes.body[0].title, 'Lab 1');
});

test('assignment create validates title and dueDate', async () => {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'val@example.com',
    password: 'password123',
    firstName: 'Val',
    lastName: 'User',
  });
  const token = reg.body.token;

  const res = await request(app)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: '', dueDate: 'not-a-date' });

  assert.equal(res.status, 400);
  assert.ok(res.body.details);
});

test('analytics dashboard requires auth and returns structure', async () => {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'dash@example.com',
    password: 'password123',
    firstName: 'Dash',
    lastName: 'Board',
  });
  const token = reg.body.token;

  // Add one assignment
  await request(app)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Quiz',
      dueDate: '2026-12-01',
      course: 'CPAN212',
      weight: 20,
      grade: 85,
    });

  const res = await request(app)
    .get('/api/analytics/dashboard')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok('totalAssignments' in res.body);
  assert.ok('courses' in res.body);
  assert.equal(res.body.totalAssignments, 1);
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
