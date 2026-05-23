// backend/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { factoryState } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

export function initDb() {
  const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'sensor_data.db');
  db = new Database(dbPath);
  // Table to store latest snapshot per zone
  db.prepare(`CREATE TABLE IF NOT EXISTS sensor_data (
    zone TEXT PRIMARY KEY,
    payload TEXT,
    updated_at TEXT
  )`).run();
  console.log('✅ SQLite DB initialized at', dbPath);
}

export function saveSensorData(zoneId, payload) {
  if (!db) return;
  const stmt = db.prepare('INSERT INTO sensor_data (zone, payload, updated_at) VALUES (@zone, @payload, @updated_at) ON CONFLICT(zone) DO UPDATE SET payload=@payload, updated_at=@updated_at');
  stmt.run({
    zone: zoneId,
    payload: JSON.stringify(payload),
    updated_at: new Date().toISOString()
  });
}

export function loadAllSensorData() {
  if (!db) return [];
  return db.prepare('SELECT zone, payload FROM sensor_data').all().map(row => ({ zone: row.zone, payload: JSON.parse(row.payload) }));
}

// Optional: hydrate factoryState at startup from persisted data
export function hydrateFactoryState() {
  const data = loadAllSensorData();
  data.forEach(({ zone, payload }) => {
    const target = factoryState.zones[zone];
    if (target) {
      Object.assign(target, payload);
    }
  });
}
