# API-Pattern

Skeleton REST API (Express + MongoDB/Mongoose + JWT) meant as a starting point
for a student project. 

## Commands

```bash
npm install
npm run dev        # NODE_ENV=dev, port 12345, local mongo database "bddexample"
npm start          # NODE_ENV=prod
npm test           # vitest
npm run lint       # ESLint (style rules + recommended bug rules)
npm run lint:fix   # ESLint with auto-fix

```

An HTTPS connection is attempted using the certificates declared in
`src/commons/config.js`. If the certificates are missing, the server starts in
HTTP (handy in dev).

## Database

The mongo database is named **`bddexample`** (see `dbURL` in
`src/commons/config.js`). It holds two collections, seeded at startup from CSV
files (`src/datasource/*.csv` + `*.dbinit.js` scripts):

- **accounts** — `username`, `password` (hashed), `email`, `permissions`
  (`admin` / `registered`), `disabled`. Seeded with 3 accounts
  (`admin`, `user1`, `user2`), all with the password `password`.
- **rooms** — `name`, `uuid`, `building`. Seeded with `room1`, `room2`,
  `room3`; the `name`, `uuid` and `building` values come from the CSV.

## Authentication

JWT signed in a cookie (`access_token`, httpOnly, signed with `secretKey`) plus
an XSRF token returned to the client. **No refresh token**: the session lasts as
long as the JWT is valid.

- `verifyTokens` (middleware): validates the signed cookie, checks that the XSRF
  header matches the JWT payload, loads `req.account`.
- `requireAdmin` / `requirePermissions(mask)`: bitmask-based control —
  `PERMISSIONS.REGISTERED = 1`, `PERMISSIONS.ADMIN = 128`.
- A `pre-validate` hook on `Account` guarantees that at least one active admin
  exists.

## Routes

`GET /api/status` is a **public** health-check: it requires neither
authentication nor database access and simply returns `{ error: 0, data: "ok" }`.
`/auth/login` and `/auth/logout` are public too. Every other route requires a
valid JWT via `verifyTokens`, and administrative operations additionally require
`requireAdmin`.

An interactive Swagger UI is served at **`/api/docs`** (public), generated from
the `openapi.yaml` spec at the project root.

```
GET    /api/docs                              [public]
GET    /api/status                            [public]

POST   /api/auth/login
DELETE /api/auth/logout

PATCH  /api/accounts/me/password
PATCH  /api/accounts/me/email

GET    /api/rooms
GET    /api/rooms/:id
POST   /api/rooms                            [admin]
PATCH  /api/rooms/:id                        [admin]
DELETE /api/rooms/:id                         [admin]
```

## Response / error conventions

Every controller uses the `answer` singleton
(`src/controllers/ControllerAnswer.js`): `answer.reset()` at the top,
`answer.setPayload(data)` on success, or `answer.set(Errors.get(...))` +
`return next(answer)` on error. Responses have the shape `{ error, data, context }`:

- `error` — integer (`0` = success, otherwise an error code),
- `data` — the payload (any type),
- `context` — optional structured details about an error (`null` when none).

There is **no `status` field** in the returned JSON; the HTTP status code is
carried by the response itself, not by the body.

Note that the bare `/api/status` health-check is the one exception: it returns a
minimal `{ error: 0, data: "ok" }` without going through the `answer` singleton.

Error codes are namespaced numeric constants in `src/commons/errors.js`
(`AUTH_*`, `ACCOUNT_*`, `DATABASE_*`, `REQ_*`).
