import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import Database from 'better-sqlite3';

// Creates a new database on the users local machine and declares the database object
let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'aether_calendar.db');
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment TEXT NOT NULL,
      due TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);
}

function registerIpcHandlers() {
  ipcMain.handle('assignments:add', (event, { assignment, due, description }) => {
    // Validates input
    if (typeof assignment !== 'string' || !assignment.trim() || typeof due !== 'string' || !due) {
      throw new Error('Assignment and due date are required');
    }
    if (typeof description !== 'string' || !description.trim()) {
      throw new Error('Description is required');
    }
    const info = db
      .prepare('INSERT INTO assignments (assignment, due, description) VALUES (?, ?, ?)')
      .run(assignment.trim(), due, description.trim());
    return { id: info.lastInsertRowid };
  });

  ipcMain.handle('assignments:list', () => {
    return db.prepare('SELECT * FROM assignments ORDER BY due').all();
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
