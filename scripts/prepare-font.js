const fs = require("fs");
const os = require("os");
const path = require("path");

const PKG = "@openfonts/noto-sans-jp_all";
const VERSION = "1.0.0";
const TARBALL_URL = `https://registry.npmjs.org/${PKG}/-/noto-sans-jp_all-${VERSION}.tgz`;
const ENTRY_PATH = "package/files/noto-sans-jp-all-400.woff2";

const OUT_DIR = path.join(__dirname, "..", "public", "fonts");
const OUT_FILE = path.join(OUT_DIR, "NotoSansJP-Regular.ttf");

async function main() {
  if (fs.existsSync(OUT_FILE) && fs.statSync(OUT_FILE).size > 0) {
    console.log("[prepare-font] already exists, skipping:", OUT_FILE);
    return;
  }

  console.log("[prepare-font] fetching", TARBALL_URL);
  const res = await fetch(TARBALL_URL);
  if (!res.ok) {
    console.warn(
      `[prepare-font] failed to fetch font package (${res.status}). PDF export will not work until this succeeds. Skipping (non-fatal).`
    );
    return;
  }
  const tarballBuffer = Buffer.from(await res.arrayBuffer());

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "prepare-font-"));
  const tarballPath = path.join(tmpDir, "pkg.tgz");
  fs.writeFileSync(tarballPath, tarballBuffer);

  console.log("[prepare-font] extracting", ENTRY_PATH);
  const tar = require("tar");
  await tar.x({
    file: tarballPath,
    cwd: tmpDir,
    filter: (p) => p === ENTRY_PATH,
  });

  const extractedPath = path.join(tmpDir, ENTRY_PATH);
  if (!fs.existsSync(extractedPath)) {
    console.warn(`[prepare-font] entry not found in tarball: ${ENTRY_PATH}. Skipping (non-fatal).`);
    return;
  }
  const woff2Buffer = fs.readFileSync(extractedPath);

  console.log("[prepare-font] decompressing woff2 -> ttf");
  const wawoff2 = require("wawoff2");
  const ttfBuffer = Buffer.from(await wawoff2.decompress(woff2Buffer));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, ttfBuffer);
  console.log("[prepare-font] wrote", OUT_FILE, `(${ttfBuffer.length} bytes)`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.warn("[prepare-font] non-fatal error, continuing build:", err?.stack || err?.message || err);
});
