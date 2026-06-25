import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

// Minimal test: the public /api/status route needs neither auth nor DB.
// (app.js skips the MongoDB connection when NODE_ENV=test.)
describe("GET /api/status", () => {
  it("answers ok", async () => {
    const res = await request(app).getError("/api/status");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ error: 0, data: "ok" });
  });
});
