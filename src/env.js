import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// Load .env and let it override variables already set in the system, so a
// GEMINI_API_KEY defined globally on the machine doesn't shadow the project's key.
if (existsSync(".env")) {
  Object.assign(process.env, parseEnv(readFileSync(".env", "utf8")));
}
