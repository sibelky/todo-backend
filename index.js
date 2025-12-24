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
app.get("/", (req, res) => res.send("Backend läuft"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Tabelle anlegen, falls noch nicht da
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id BIGSERIAL PRIMARY KEY,
      task TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
initDb().catch(console.error);

// GET todos
app.get("/api/todos", async (req, res) => {
  const result = await pool.query("SELECT id, task, done FROM todos ORDER BY id DESC");
  res.json(result.rows);
});

// POST todo
app.post("/api/todos", (req, res) => {
  const todo = { id: Date.now(), task: req.body.task, done: false };
  todos.push(todo);

  console.log("Neues Todo erhalten:");
  console.log(todo);
  console.log("Aktueller Todo-Stand:", todos);

  res.json(todo);
});


// PUT todo done/undone
app.put("/api/todos/:id", async (req, res) => {
  const { done } = req.body;
  const { id } = req.params;

  const result = await pool.query(
    "UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, task, done",
    [!!done, id]
  );

  if (result.rowCount === 0) return res.status(404).send("Not found");
  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
