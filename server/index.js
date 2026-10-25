// server/index.js
import "dotenv/config";
import process from "node:process";
import app from "./app.js";
import { connectDB } from "./utils/db.js";
import "./utils/models.js";

const port = Number(process.env.PORT) || 8001;

async function main() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
