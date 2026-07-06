import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = [".next", "node_modules/.cache"];

async function stopDevServers() {
  await import("./stop-dev.mjs");
}

function removeDir(dirPath) {
  const label = path.relative(root, dirPath);

  if (!fs.existsSync(dirPath)) {
    console.log(`skip (not found): ${label}`);
    return true;
  }

  try {
    fs.rmSync(dirPath, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 300,
    });
    console.log(`removed: ${label}`);
    return true;
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : undefined;
    console.error(`failed: ${label}`);

    if (code === "EBUSY" || code === "EPERM") {
      console.error(
        "Could not delete cache. Close all terminals running npm run dev, then run npm run clean again."
      );
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }

    return false;
  }
}

console.log("Cleaning Next.js cache...");
await stopDevServers();

let ok = true;
for (const target of targets) {
  if (!removeDir(path.join(root, target))) {
    ok = false;
  }
}

if (!ok) {
  process.exit(1);
}

console.log("Done. Start the app with: npm run dev");
