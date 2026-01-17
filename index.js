import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Request-Logging (sicher, ohne Template-Strings)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Root
app.get("/", (req, res) => res.send("Backend läuft ✅"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// DB init (nur urgent, KEINE deadline)
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE,
        urgent BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    await pool.query(`
      ALTER TABLE todos
      ADD COLUMN IF NOT EXISTS urgent BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    console.log("DB init OK");
  } catch (err) {
    console.error("DB init error (ignored):", err.message);
  }
}

initDb();

// GET todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, task, done, urgent FROM todos ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB Fehler" });
  }
});

// POST todo
app.post("/api/todos", async (req, res) => {
  try {
    const { task } = req.body;
    if (!task || !task.trim()) {
      return res.status(400).json({ error: "task fehlt" });
    }

    const result = await pool.query(
      "INSERT INTO todos (task, done, urgent) VALUES ($1, FALSE, FALSE) RETURNING id, task, done, urgent",
      [task.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB Fehler" });
  }
});

// PUT todo (done / urgent)
app.put("/api/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const done = req.body?.done;
    const urgent = req.body?.urgent;

    const result = await pool.query(
      `
      UPDATE todos
      SET
        done = COALESCE($1, done),
        urgent = COALESCE($2, urgent)
      WHERE id = $3
      RETURNING id, task, done, urgent
      `,
      [done, urgent, id]
    );

    if (result.rowCount === 0) return res.status(404).send("Not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB Fehler" });
  }
  // DELETE todo (endgültig löschen)
  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const result = await pool.query(
        "DELETE FROM todos WHERE id = $1 RETURNING id",
        [id]
      );

      if (result.rowCount === 0) return res.status(404).send("Not found");
      res.json({ success: true, id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "DB Fehler" });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));