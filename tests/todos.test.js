import request from "supertest";
import app from "../index.js";

// Fake-Datenbank für Tests
beforeAll(() => {
  global.poolMock = {
    todos: [],
    async query(sql, params = []) {
      // SELECT
      if (sql.startsWith("SELECT")) {
        return { rows: this.todos };
      }

      // INSERT
      if (sql.startsWith("INSERT")) {
        const task = params[0];
        const todo = {
          id: Date.now(),
          task,
          done: false,
          urgent: false
        };
        this.todos.unshift(todo);
        return { rows: [todo] };
      }

      // UPDATE
      if (sql.startsWith("UPDATE")) {
        const done = params[0];
        const urgent = params[1];
        const id = params[2];

        const todo = this.todos.find(t => t.id === id);
        if (!todo) return { rowCount: 0, rows: [] };

        if (done !== undefined && done !== null) todo.done = done;
        if (urgent !== undefined && urgent !== null) todo.urgent = urgent;

        return { rowCount: 1, rows: [todo] };
      }

      // DELETE
      if (sql.startsWith("DELETE")) {
        const id = params[0];
        const before = this.todos.length;
        this.todos = this.todos.filter(t => t.id !== id);
        const rowCount = before === this.todos.length ? 0 : 1;
        return { rowCount, rows: rowCount ? [{ id }] : [] };
      }

      return { rows: [] };
    }
  };
});

describe("Todos API", () => {
  it("GET /api/todos -> 200 und Array", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/todos -> 201 und Todo wird zurückgegeben", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ task: "Test Todo" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.task).toBe("Test Todo");
    expect(res.body.done).toBe(false);
    expect(res.body.urgent).toBe(false);
  });

  it("POST /api/todos ohne task -> 400", async () => {
    const res = await request(app).post("/api/todos").send({});
    expect(res.statusCode).toBe(400);
  });
});