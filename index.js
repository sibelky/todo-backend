import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

let todos = []; // einfache Array-Datenbank

app.get("/api/todos", (req, res) => res.json(todos));

app.post("/api/todos", (req, res) => {
  const todo = { id: Date.now(), task: req.body.task, done: false };
  todos.push(todo);
  res.json(todo);
});

app.put("/api/todos/:id", (req, res) => {
  const todo = todos.find(t => t.id == req.params.id);
  if (todo) {
    todo.done = req.body.done;
    res.json(todo);
  } else res.status(404).send("Not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
