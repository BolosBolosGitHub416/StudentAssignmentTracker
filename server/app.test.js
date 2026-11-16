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

test('students can only create assignments for their own account', async () => {
  const registration = await request(app).post('/api/auth/register').send({
    email: 'owner@example.com',
    password: 'password123',
    firstName: 'Own',
    lastName: 'Er',
  });
  const createResponse = await request(app)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${registration.body.token}`)
    .send({
      title: 'Lab report',
      course: 'Biology 101',
      weight: 20,
      dueDate: '2026-11-01',
      studentId: new mongoose.Types.ObjectId().toString(),
    });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.course, 'Biology 101');
  assert.equal(createResponse.body.weight, 20);
  assert.equal(createResponse.body.studentId, registration.body.user.id);

  const otherRegistration = await request(app).post('/api/auth/register').send({
    email: 'other@example.com',
    password: 'password123',
    firstName: 'Other',
    lastName: 'Student',
  });
  const otherList = await request(app)
    .get('/api/assignments')
    .set('Authorization', `Bearer ${otherRegistration.body.token}`);
  assert.equal(otherList.status, 200);
  assert.deepEqual(otherList.body, []);
});

test('assignment validation rejects weights and grades above 100', async () => {
  const registration = await request(app).post('/api/auth/register').send({
    email: 'limits@example.com',
    password: 'password123',
    firstName: 'Limit',
    lastName: 'Tester',
  });

  for (const field of ['weight', 'grade']) {
    const response = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        title: 'Lab report',
        dueDate: '2026-11-01',
        [field]: 101,
      });

    assert.equal(response.status, 400);
    assert.ok(response.body.details[field]);
  }
});

test('analytics dashboard reports the authenticated student assignments', async () => {
  const registration = await request(app).post('/api/auth/register').send({
    email: 'analytics@example.com',
    password: 'password123',
    firstName: 'Analyze',
    lastName: 'Student',
  });

  await request(app)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${registration.body.token}`)
    .send({
      title: 'Lab report',
      course: 'Biology 101',
      dueDate: '2026-11-01',
      weight: 20,
      grade: 88,
    });

  const response = await request(app)
    .get('/api/analytics/dashboard')
    .set('Authorization', `Bearer ${registration.body.token}`);
  const dashboard = response.body;

  assert.equal(response.status, 200);
  assert.equal(dashboard.totalAssignments, 1);
  assert.equal(dashboard.completedAssignments, 1);
  assert.equal(dashboard.totalCourses, 1);
  assert.equal(dashboard.courses[0].courseName, 'Biology 101');
  assert.equal(dashboard.courses[0].gpa.percentage, 88);
});


test('registration prevents users from becoming admins', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'securitytest@example.com',
      password: 'password123',
      firstName: 'Security',
      lastName: 'Test',
      role: 'admin',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'student');
});


test('registration accepts a one-character password', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'shortpassword@example.com',
      password: 'a',
      firstName: 'Short',
      lastName: 'Password',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'shortpassword@example.com');
});

test('registration rejects an empty password', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'emptypassword@example.com',
      password: '',
      firstName: 'Empty',
      lastName: 'Password',
    });

  assert.equal(res.status, 400);
  assert.ok(res.body.details.password);
});

test('registration rejects passwords longer than 72 characters', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'longpassword@example.com',
      password: 'a'.repeat(73),
      firstName: 'Long',
      lastName: 'Password',
    });

  assert.equal(res.status, 400);
  assert.ok(res.body.details.password);
});


test('notification routes require authentication', async () => {
  const res = await request(app)
    .get('/api/notifications');

  assert.equal(res.status, 401);
});

test('registered student can retrieve notifications', async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'notifications@example.com',
      password: 'password123',
      firstName: 'Notification',
      lastName: 'Tester',
    });

  assert.equal(reg.status, 201);

  const res = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${reg.body.token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.items));
  assert.equal(res.body.unreadCount, 0);
});

test('registered student can retrieve announcements', async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'announcements@example.com',
      password: 'password123',
      firstName: 'Announcement',
      lastName: 'Tester',
    });

  assert.equal(reg.status, 201);

  const res = await request(app)
    .get('/api/announcements')
    .set('Authorization', `Bearer ${reg.body.token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('registered student can retrieve course chat messages', async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'messages@example.com',
      password: 'password123',
      firstName: 'Message',
      lastName: 'Tester',
    });

  assert.equal(reg.status, 201);

  const res = await request(app)
    .get('/api/messages?course=CPAN324')
    .set('Authorization', `Bearer ${reg.body.token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});


