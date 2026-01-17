import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Loggt jede Request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Root-Route
app.get("/", (req, res) => res.send("Backend läuft ✅"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Tabelle anlegen + Spalten absichern (ohne Deploy-Crash)
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE,
        urgent BOOLEAN NOT NULL DEFAULT FALSE,
        deadline DATE
      );
    `);

    // Für alte Tabellen: Spalten einzeln nachziehen
    await pool.query(`
      ALTER TABLE todos
      ADD COLUMN IF NOT EXISTS urgent BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await pool.query(`
      ALTER TABLE todos
      ADD COLUMN IF NOT EXISTS deadline DATE;
    `);

    console.log("DB init erfolgreich ✅");
  } catch (err) {
    // Wichtig: NICHT crashen lassen, sonst Render Deploy failed
    console.error("DB init Fehler (Server läuft trotzdem weiter):", err.message);
  }
}

initDb();

// GET todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, task, done, urgent, deadline FROM todos ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/todos error:", err);
    res.status(500).json({ error: "DB Fehler" });
  }
});

// POST todo (task + optional deadline)
app.post("/api/todos", async (req, res) => {
  try {
    const { task, deadline } = req.body;

    if (!task || !task.trim()) {
      return res.status(400).json({ error: "task fehlt" });
    }

    const result = await pool.query(
      "INSERT INTO todos (task, done, urgent, deadline) VALUES ($1, FALSE, FALSE, $2) RETURNING id, task, done, urgent, deadline",
      [task.trim(), deadline || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/todos error:", err);
    res.status(500).json({ error: "DB Fehler" });
  }
});

// PUT todo (done/urgent/deadline optional updaten)
app.put("/api/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const done = req.body?.done;
    const urgent = req.body?.urgent;
    const deadline = req.body?.deadline;

    const result = await pool.query(
      `
      UPDATE todos
      SET
        done = COALESCE($1, done),
        urgent = COALESCE($2, urgent),
        deadline = COALESCE($3, deadline)
      WHERE id = $4
      RETURNING id, task, done, urgent, deadline
      `,
      [done, urgent, deadline, id]
    );

    if (result.rowCount === 0) return res.status(404).send("Not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/todos/:id error:", err);
    res.status(500).json({ error: "DB Fehler" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(Server läuft auf Port ${PORT}));