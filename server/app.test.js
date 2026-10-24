import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import process from "node:process";
import app from "./app.js";
import { assignments } from "./models/assignments.js";
import { users } from "./models/users.js";
import { generateToken } from "./middleware/auth.js";

process.env.JWT_SECRET = "test-only-secret";

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
