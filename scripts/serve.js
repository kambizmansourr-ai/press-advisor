// Zero-dependency static file server for the exported /out folder.
// This is the "run the app" entry point: it needs no internet access,
// no npm install beyond what's already in node_modules, and once the
// PWA is installed from it once, the installed icon works fully offline.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = path.resolve(__dirname, "../out");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

if (!fs.existsSync(ROOT)) {
  console.error('No "out" folder found. Run `npm run build` first.');
  process.exit(1);
}

function resolveFile(urlPath) {
  let filePath = path.join(ROOT, decodeURIComponent(urlPath.split("?")[0]));
  if (!filePath.startsWith(ROOT)) return null; // block path traversal
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    const withHtml = filePath + ".html";
    if (fs.existsSync(withHtml)) filePath = withHtml;
    else return null;
  }
  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFile(req.url === "/" ? "/index.html" : req.url);
  if (!filePath) {
    const notFound = path.join(ROOT, "404", "index.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "404 Not Found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  آرس زنجان — سیستم هوشمند انتخاب پرس`);
  console.log(`  در حال اجرا روی ${url}\n`);
  console.log("  برای نصب به‌صورت اپلیکیشن مستقل: در مرورگر روی دکمه «نصب اپلیکیشن» کلیک کنید.\n");

  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
});
