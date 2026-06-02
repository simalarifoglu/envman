import { ipcMain, dialog, clipboard, app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
function parseEnvFile(content) {
  const lines = content.split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      const rest2 = trimmed.slice(1).trim();
      const eqIndex2 = rest2.indexOf("=");
      if (eqIndex2 !== -1) {
        const key2 = rest2.slice(0, eqIndex2).trim();
        const rawVal = rest2.slice(eqIndex2 + 1).trim();
        if (key2 && !key2.includes(" ")) {
          entries.push({
            key: key2,
            value: stripQuotes(rawVal),
            enabled: false
          });
          continue;
        }
      }
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const rest = trimmed.slice(eqIndex + 1);
    const { value, comment } = splitValueComment(rest);
    entries.push({
      key,
      value: stripQuotes(value.trim()),
      comment: comment || void 0,
      enabled: true
    });
  }
  return entries;
}
function serializeEnvFile(entries) {
  return entries.map((e) => {
    const val = needsQuotes(e.value) ? `"${e.value}"` : e.value;
    const comment = e.comment ? ` # ${e.comment}` : "";
    const line = `${e.key}=${val}${comment}`;
    return e.enabled ? line : `# ${line}`;
  }).join("\n") + "\n";
}
function stripQuotes(val) {
  if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  return val;
}
function needsQuotes(val) {
  return val.includes(" ") || val.includes("#") || val.includes('"');
}
function splitValueComment(raw) {
  if (raw.startsWith('"')) {
    const closeQ = raw.indexOf('"', 1);
    if (closeQ !== -1) {
      const after = raw.slice(closeQ + 1);
      const cIdx2 = after.indexOf("#");
      return {
        value: raw.slice(0, closeQ + 1),
        comment: cIdx2 !== -1 ? after.slice(cIdx2 + 1).trim() : ""
      };
    }
  }
  const cIdx = raw.indexOf("#");
  if (cIdx === -1) return { value: raw, comment: "" };
  return {
    value: raw.slice(0, cIdx),
    comment: raw.slice(cIdx + 1).trim()
  };
}
const ENV_PATTERNS = /^\.env(\..+)?$/;
function scanFolder(folderPath) {
  const results = [];
  function walk(dir, depth = 0) {
    if (depth > 5) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.isDirectory()) continue;
      if (entry.name === "node_modules") continue;
      if (entry.name === ".git") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.isFile() && ENV_PATTERNS.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const entries2 = parseEnvFile(content);
          results.push({
            filename: entry.name,
            path: fullPath,
            entries: entries2
          });
        } catch {
        }
      }
    }
  }
  walk(folderPath);
  return results;
}
function readEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const entries = parseEnvFile(content);
  return {
    filename: path.basename(filePath),
    path: filePath,
    entries
  };
}
function writeEnvFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf-8");
}
const require$1 = createRequire(import.meta.url);
const Store = require$1("electron-store");
const store = new Store({ defaults: { projects: [] } });
function getProjects() {
  return store.get("projects", []);
}
function addProject(project) {
  const projects = getProjects();
  const exists = projects.find((p) => p.folderPath === project.folderPath);
  if (!exists) {
    store.set("projects", [...projects, project]);
  }
}
function removeProject(id) {
  const projects = getProjects();
  store.set("projects", projects.filter((p) => p.id !== id));
}
function updateProjectName(id, name) {
  const projects = getProjects();
  store.set(
    "projects",
    projects.map((p) => p.id === id ? { ...p, name } : p)
  );
}
function registerIpcHandlers() {
  ipcMain.handle("projects:get", () => {
    return getProjects();
  });
  ipcMain.handle("projects:add-by-dialog", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Proje klasörünü seç"
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const folderPath = result.filePaths[0];
    const name = folderPath.split(/[\\/]/).pop() ?? folderPath;
    const id = randomUUID();
    const project = { id, name, folderPath };
    addProject(project);
    const envFiles = scanFolder(folderPath);
    return { ...project, envFiles };
  });
  ipcMain.handle("projects:add-by-path", (_e, folderPath) => {
    const name = folderPath.split(/[\\/]/).pop() ?? folderPath;
    const id = randomUUID();
    const project = { id, name, folderPath };
    addProject(project);
    const envFiles = scanFolder(folderPath);
    return { ...project, envFiles };
  });
  ipcMain.handle("projects:remove", (_e, id) => {
    removeProject(id);
    return true;
  });
  ipcMain.handle("projects:rename", (_e, id, name) => {
    updateProjectName(id, name);
    return true;
  });
  ipcMain.handle("projects:scan", (_e, folderPath) => {
    return scanFolder(folderPath);
  });
  ipcMain.handle("envfile:read", (_e, filePath) => {
    return readEnvFile(filePath);
  });
  ipcMain.handle("envfile:write", (_e, filePath, entries) => {
    const content = serializeEnvFile(entries);
    writeEnvFile(filePath, content);
    return true;
  });
  ipcMain.handle("clipboard:write", (_e, text) => {
    clipboard.writeText(text);
    return true;
  });
  ipcMain.handle("projects:discover", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Ana klasörü seç — alt projeler taranacak"
    });
    if (result.canceled || result.filePaths.length === 0) return [];
    const parentPath = result.filePaths[0];
    const { readdirSync } = await import("node:fs");
    const discovered = [];
    for (const entry of readdirSync(parentPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const folderPath = `${parentPath}/${entry.name}`;
      const envFiles = scanFolder(folderPath);
      if (envFiles.length === 0) continue;
      const id = randomUUID();
      const project = { id, name: entry.name, folderPath };
      addProject(project);
      discovered.push({ ...project, envFiles });
    }
    return discovered;
  });
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
