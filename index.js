const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Beispiel-Daten (in-memory, bei Neustart verloren)
let todos = [
  { id: 1, task: "Beispiel-Todo 1", done: false },
  { id: 2, task: "Beispiel-Todo 2", done: true }
];

// GET: Alle Todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST: Neues Todo hinzufügen
app.post('/api/todos', (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task ist erforderlich" });
  const newTodo = { id: todos.length + 1, task, done: false };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT: Status ändern (erledigt/offen)
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { done } = req.body;
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: "Todo nicht gefunden" });
  todo.done = done;
  res.json(todo);
});

// DELETE: Todo löschen
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  todos = todos.filter(t => t.id !== id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
