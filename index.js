const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Beispiel-Daten
let todos = [
  { id: 1, task: "Wocheneinkauf erledigen", done: false },
  { id: 2, task: "Oma anrufen", done: false },
  { id: 3, task: "Termin beim Zahnarzt vereinbaren", done: false }
];

// Root-Route
app.get("/", (req, res) => {
  res.send("Todo-Backend läuft! Verwende /api/todos für die API.");
});

// API-Route
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

// Port setzen (Render setzt process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
