import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";

const isDevelopment = process.env.NODE_ENV === "development";
const rendererDevUrl = process.env.ELECTRON_RENDERER_URL;

let mainWindow: BrowserWindow | null = null;

function getRendererEntryPoint(): string {
  if (isDevelopment && rendererDevUrl) {
    return rendererDevUrl;
  }

  return `file://${path.join(app.getAppPath(), "out", "index.html")}`;
}

function registerIpcHandlers() {
  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:ping", () => "pong");
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const entryPoint = getRendererEntryPoint();
  mainWindow.loadURL(entryPoint);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
