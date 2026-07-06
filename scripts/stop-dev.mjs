import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ports = [3000, 3001];

function stopProcessesOnPorts() {
  if (process.platform !== "win32") {
    for (const port of ports) {
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
        console.log(`stopped processes on port ${port}`);
      } catch {
        // port free
      }
    }
    return;
  }

  for (const port of ports) {
    try {
      const output = execSync(`netstat -ano | findstr ":${port}"`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });

      const pids = new Set(
        output
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid) && pid !== "0")
      );

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`stopped process on port ${port} (pid ${pid})`);
        } catch {
          // ignore
        }
      }
    } catch {
      // port not in use
    }
  }
}

function removeDevLock() {
  const lockPath = path.join(root, ".next", "dev", "lock");
  if (fs.existsSync(lockPath)) {
    try {
      fs.rmSync(lockPath, { force: true });
      console.log("removed stale dev lock");
    } catch {
      // ignore
    }
  }
}

stopProcessesOnPorts();
removeDevLock();
