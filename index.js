const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const todos = [
  { id: 1, text: "Einkaufen" },
  { id: 2, text: "Zimmer streichen" }
];

app.get("/api/todos", (req, res) => {
  res.json(todos);
});

app.listen(port, () => {
  console.log("Server läuft auf Port " + port);
});
