import "dotenv/config";
import process from "node:process";
import app from "./app.js";

const port = Number(process.env.PORT) || 8001;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
