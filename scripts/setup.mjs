// One-time setup: web deps, LiveKit server binary, Python agent with local speech models. No Docker, nothing system-wide.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { platform, arch } from "node:os";

const run = (cmd, opts = {}) => {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
};
const has = (cmd) => {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const LIVEKIT_VERSION = "v1.13.10";
const KOKORO = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example. Add your ANTHROPIC_API_KEY to it.");
}

run("npm install --no-audit --no-fund", { cwd: "apps/web" });

// LiveKit media server. Linux has release binaries; macOS builds from source with Go (LiveKit ships no macOS binary).
mkdirSync(".bin", { recursive: true });
if (existsSync(".bin/livekit-server") || has("livekit-server")) console.log("\nLiveKit server present.");
else if (platform() === "linux") {
  const a = arch() === "arm64" ? "arm64" : "amd64";
  const v = LIVEKIT_VERSION.slice(1);
  run(`curl -sL https://github.com/livekit/livekit/releases/download/${LIVEKIT_VERSION}/livekit_${v}_linux_${a}.tar.gz | tar -xz -C .bin livekit-server`);
} else if (has("go")) {
  run(`rm -rf .bin/src && git clone -q --depth 1 --branch ${LIVEKIT_VERSION} https://github.com/livekit/livekit .bin/src`);
  run("go build -o ../livekit-server ./cmd/server", { cwd: ".bin/src" });
  run("rm -rf .bin/src");
} else {
  console.error("\nInstall Go (https://go.dev/dl) or run `brew install livekit`, then rerun npm run setup.");
  process.exit(1);
}

// Voice agent: Python venv, local VAD / turn detector / Whisper / Kokoro weights.
const py = "apps/agent/.venv/bin/python";
if (!existsSync(py)) run("python3 -m venv apps/agent/.venv");
run(`${py} -m pip install -q --upgrade pip`);
run(`${py} -m pip install -q -r apps/agent/requirements.txt`);
mkdirSync("apps/agent/models", { recursive: true });
for (const f of ["kokoro-v1.0.int8.onnx", "voices-v1.0.bin"])
  if (!existsSync(`apps/agent/models/${f}`)) run(`curl -sL --retry 5 -o apps/agent/models/${f} ${KOKORO}/${f}`);
run(`${py} agent.py download-files`, { cwd: "apps/agent" });
run(`${py} -c "from faster_whisper import WhisperModel; WhisperModel('base.en', compute_type='int8')"`);

console.log("\nSetup done. Add ANTHROPIC_API_KEY to .env, then run: npm run dev");
