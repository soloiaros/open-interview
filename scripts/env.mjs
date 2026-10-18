// Tiny .env loader shared by the scripts. Values already in the environment win.
import { existsSync, readFileSync } from "node:fs";

export function loadEnv(file = ".env") {
  const env = {};
  if (existsSync(file))
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trimStart().startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  return { ...env, ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined)) };
}
