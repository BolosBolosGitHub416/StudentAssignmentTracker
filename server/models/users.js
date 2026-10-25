import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const usersFile = process.env.USER_STORE_FILE ||
  fileURLToPath(new URL("../data/users.json", import.meta.url));

let savedUsers = [];
try {
  savedUsers = JSON.parse(readFileSync(usersFile, "utf8"));
  if (!Array.isArray(savedUsers)) {
    throw new Error(`User data in ${usersFile} must be an array`);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

export const users = savedUsers;

export const saveUsers = () => {
  mkdirSync(dirname(resolve(usersFile)), { recursive: true });
  const temporaryFile = `${usersFile}.${process.pid}.tmp`;
  writeFileSync(temporaryFile, JSON.stringify(users, null, 2), { mode: 0o600 });
  renameSync(temporaryFile, usersFile);
};
