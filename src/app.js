import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import { secretKey, environments } from "./commons/config.js";
import { getStatus } from "./commons/errors.js";
import apiRouter from "./routes/api.route.js";
import initBdD from "./datasource/db.init.js";

const { json, urlencoded } = bodyParser;

let env = environments.production;
if (process.env.NODE_ENV === "dev") {
  env = environments.dev;
}
else if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "prod";
}

const app = express();

const corsOptions = {
  methods: "GET,POST,PUT,PATCH,DELETE",
  origin: env.originCORS, // tests on origin may differ, depending on exec env -> get it from env config in config.js
  allowedHeaders: "x-xsrf-token, Origin, Content-Type, Accept, Authorization", // added x-xsrf-token for CSRF protection
  credentials: true, // automatically send auth cookies in the request
};

// MongoDB (NB: no connection in test env)
if (false /* temporarily disabled: process.env.NODE_ENV !== "test" */) {
  const mongoDB = process.env.MONGODB_URI || env.dbURL;
  mongoose.connect(mongoDB);
  mongoose.Promise = global.Promise;
  mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));
  // when ready, init the DB
  mongoose.connection.once("open", () => initBdD().catch(err => console.error("DB init error:", err)));
}

app.use(cookieParser(secretKey));
app.use(cors(corsOptions));
app.use(json({ limit: "30mb" }));
app.use(urlencoded({ extended: false, limit: "30mb" }));

app.use((req, _res, next) => {
  console.info(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Globale Variable für den letzten Abstand
let latestDistance = null;
let updateCount = 0;

// Beispiel-Funktion für eure Musik-Logik
function processMusicTone(distance) {
    // Da dies außerhalb der Antwortschleife läuft, verlangsamt es den ESP32 nicht.
    latestDistance = distance; // Speichere den Wert für das Frontend
    updateCount++; // Zähler erhöhen, damit das Frontend auch identische aufeinanderfolgende Werte erkennt
    if (distance === 0) {
        console.log("-> Sound STOP / Mute");
    } else {
        console.log(`-> Frequenz/Lautstärke anpassen für Distanz: ${distance} cm`);
    }
}

// Endpunkt für das Frontend zum Abrufen des neuesten Werts
app.get('/api/distance', (req, res) => {
    res.json({ distance: latestDistance, updateCount });
});

// Die optimierte Route für den ESP32 (passend zu eurem PHP-Äquivalent)
app.get('/echo_get.php', (req, res) => {
    const distanceStr = req.query.string;
    
    // 1. SOFORTige Antwort an den ESP32 senden, um die Verbindung freizugeben!
    res.sendStatus(200); 

    // 2. Daten asynchron im Hintergrund verarbeiten
    if (distanceStr !== undefined) {
        const distance = parseInt(distanceStr, 10);
        
        // Hier wird euer Musik-Trigger aufgerufen
        processMusicTone(distance);
    }
});

app.use("/api", apiRouter);
app.use((_req, res) => {
  res.status(404).send({ error: 1, data: "Invalid API route" });
});

app.use((err, _req, res, _next) => {
  console.error(JSON.stringify(err));
  // A native/unexpected error has no `error` code: answer with a generic 500.
  if (err.error === undefined) {
    res.status(500).send({ error: 2, data: "Internal API error" });
  }
  else {
    // The HTTP status code comes from the error library defined in errors.js (not from the body).
    res.status(getStatus(err.error)).send(err);
  }
});

export default app;
