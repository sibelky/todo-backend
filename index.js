import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// Render Postgres DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Tabelle sicher anlegen
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      task TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}
initDb().catch((e) => console.error("DB init error:", e));

// Root (damit / nicht mehr "Cannot GET /" zeigt)
app.get("/", (req, res) => res.send("Backend läuft ✅"));

// GET todos
app.get("/api/todos", async (req, res) => {
  const result = await pool.query("SELECT id, task, done FROM todos ORDER BY id ASC;");
  res.json(result.rows);
});

// POST todo
app.post("/api/todos", async (req, res) => {
  const { task } = req.body;
  if (!task || !task.trim()) return res.status(400).json({ error: "task fehlt" });

  const result = await pool.query(
    "INSERT INTO todos (task, done) VALUES ($1, false) RETURNING id, task, done;",
    [task.trim()]
  );
  res.json(result.rows[0]);
});

// PUT done true/false
app.put("/api/todos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { done } = req.body;

  const result = await pool.query(
    "UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, task, done;",
    [!!done, id]
  );

  if (result.rowCount === 0) return res.status(404).send("Not found");
  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
