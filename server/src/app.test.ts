import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("Express 5 request pipeline", () => {
  it("serves health without attempting to replace read-only req.query", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
