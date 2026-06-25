import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

import { login, logout } from "../controllers/auth.controller.js";
import { changeOwnPassword, changeOwnEmail } from "../controllers/account.controller.js";
import {
  getRooms, getRoomById, createRoom, updateRoom, deleteRoom,
} from "../controllers/room.controller.js";

import { verifyTokens, requireAdmin } from "../middleware/rightchecker.js";

const router = Router();

// Avoid not-caught promise results returned by controllers by "redirecting"
// such a situation to an error case manageed by calling next()
const errorGuard = (ctrl) => (req, res, next) =>
  Promise.resolve(ctrl(req, res, next)).catch(next);

/* ----------- API DOCS (Swagger UI) -----------
 Serves the OpenAPI spec (NB: openapi.yaml at the project root) as an
 interactive Swagger UI on /api/docs.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiSpec = YAML.parse(
  readFileSync(path.join(__dirname, "../../openapi.yaml"), "utf8"),
);
router.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

/* ----------- STATUS (check if API is alive) ----------- */
router.get("/status", (_req, res) => res.status(200).send({ error: 0, data: "ok" }));

/* ----------- AUTH ----------- */
router.post("/auth/login", errorGuard(login));
router.delete("/auth/logout", errorGuard(logout));

/* ----------- ACCOUNTS ----------- */
router.patch("/accounts/me/password", verifyTokens, errorGuard(changeOwnPassword));
router.patch("/accounts/me/email", verifyTokens, errorGuard(changeOwnEmail));

/* ----------- ROOMS (CRUD) ----------- */
router.get("/rooms", verifyTokens, errorGuard(getRooms));
router.get("/rooms/:id", verifyTokens, errorGuard(getRoomById));
router.post("/rooms", verifyTokens, requireAdmin, errorGuard(createRoom));
router.patch("/rooms/:id", verifyTokens, requireAdmin, errorGuard(updateRoom));
router.delete("/rooms/:id", verifyTokens, requireAdmin, errorGuard(deleteRoom));

export default router;
