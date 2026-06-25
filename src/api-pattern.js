/* ***********************
 Execution entry point
************************ */

import { readFileSync } from "fs";
import { createServer as createHttpsServer } from "https";
import { createServer as createHttpServer } from "http";
import app from "./app.js";
import { environments } from "./commons/config.js";

let env = environments.production;
if (process.env.NODE_ENV === "dev") env = environments.dev;
else process.env.NODE_ENV = "prod";

// Start HTTPS if the certificates are available, otherwise HTTP (useful in dev without SSL)
try {
  const credentials = {
    key:  readFileSync(env.sslKey, "utf8"),
    cert: readFileSync(env.sslCrt, "utf8"),
  };
  createHttpsServer(credentials, app).listen(env.httpPORT, () =>
    console.info(`API-Pattern started on HTTPS port ${env.httpPORT}, in ${env.envName} mode`),
  );
}
catch (err) {
  console.warn(`SSL credentials not found (${err.message}). Falling back to HTTP.`);
  createHttpServer(app).listen(env.httpPORT, () =>
    console.info(`API-Pattern started on HTTP port ${env.httpPORT}, in ${env.envName} mode`),
  );
}
