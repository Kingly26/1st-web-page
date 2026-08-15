// ============================================================
// SERVER BACKEND (Node.js + Express)
// ============================================================
// Questo file avvia un piccolo server web che fa 2 cose:
//  1. Riceve immagini caricate dal frontend React e le salva
//     nella cartella "uploads/" su disco.
//  2. Espone un elenco (in formato JSON) di tutte le immagini
//     caricate, così il sito React può mostrarle in una galleria.
//
// "Full-stack" significa proprio questo: un frontend (React, che
// gira nel browser) che parla con un backend (questo server, che
// gira su una macchina) tramite delle richieste HTTP.
// ============================================================

import express from "express"; // framework per creare API web in Node.js
import multer from "multer"; // libreria specializzata nel gestire upload di file
import cors from "cors"; // permette al frontend (porta diversa) di chiamare questo backend
import path from "path"; // utility per lavorare con percorsi di file/cartelle
import { fileURLToPath } from "url";
import fs from "fs";
import jwt from "jsonwebtoken"; // crea e verifica i token di accesso (JWT)
import "dotenv/config"; // legge il file .env e lo mette dentro process.env

// In un modulo ES ("type": "module" nel package.json) non esiste
// automaticamente __dirname come in CommonJS, quindi lo ricaviamo
// a mano a partire dall'URL del file corrente.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cartella dove finiranno fisicamente le immagini caricate.
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Se la cartella "uploads" non esiste ancora, la creiamo.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Creiamo l'app Express: è l'oggetto principale che gestisce
// tutte le richieste HTTP in arrivo.
const app = express();
const PORT = process.env.PORT || 3001; // React (Vite) di solito gira sulla porta 5173, quindi usiamo una porta diversa

// Quando il server gira dietro un reverse proxy (come Nginx Proxy
// Manager), questa riga fa sì che Express legga correttamente
// l'header "X-Forwarded-Proto" per capire se la richiesta originale
// era HTTPS, anche se internamente arriva come HTTP dal proxy.
app.set("trust proxy", true);

// Credenziali e segreto letti dal file .env (mai scritti direttamente
// nel codice, così restano fuori da Git).
const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = process.env;

// --- MIDDLEWARE ---
// Un "middleware" è una funzione che intercetta ogni richiesta
// prima che arrivi alla rotta finale, per fare controlli o modifiche.

// cors() abilita le richieste "cross-origin": senza questo, il
// browser bloccherebbe le chiamate da http://localhost:5173 (React)
// verso http://localhost:3001 (questo backend), perché sono
// considerate due "origini" diverse.
app.use(cors());

// express.json() legge il body delle richieste quando è in formato
// JSON (es. { "username": "...", "password": "..." }) e lo rende
// disponibile in req.body. Serve per la rotta di login qui sotto.
app.use(express.json());

// Rende pubblica la cartella "uploads": tutto quello che ci
// finisce dentro è raggiungibile via URL, es:
// http://localhost:3001/uploads/nomefile.jpg
app.use("/uploads", express.static(UPLOADS_DIR));

// --- CONFIGURAZIONE MULTER (gestione upload) ---
// diskStorage dice a multer: "salva i file su disco, in questa
// cartella, con questo nome".
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); // dove salvare
  },
  filename: (req, file, cb) => {
    // Per evitare che due immagini con lo stesso nome si
    // sovrascrivano, anteponiamo un timestamp al nome originale.
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// --- AUTENTICAZIONE ---
//
// Come funziona in breve (JWT = "JSON Web Token"):
//  1. L'utente invia username e password a POST /api/login.
//  2. Se sono corretti, il server crea un "token" firmato con
//     JWT_SECRET e lo restituisce al frontend.
//  3. Il frontend salva il token (in localStorage) e lo rimanda ad
//     ogni richiesta protetta, dentro l'header
//     "Authorization: Bearer <token>".
//  4. Il server verifica la firma del token: se è valida ed è ancora
//     nei termini di scadenza, sa che la richiesta viene davvero da
//     chi ha fatto login, senza dover ricontrollare la password ogni volta.
//
// Nota didattica: qui confrontiamo la password in chiaro con quella
// nel file .env. Va bene per un progetto personale con un solo
// account admin; in un'app reale con più utenti si salvano le
// password già "hashate" (es. con bcrypt) e non si confrontano mai
// in chiaro.

// POST /api/login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

  if (!isValid) {
    return res.status(401).json({ error: "Credenziali non valide" });
  }

  // Creiamo il token: dentro c'è il nome utente (payload), è firmato
  // con JWT_SECRET e scade dopo 2 ore ("expiresIn").
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });

  res.json({ token });
});

// Middleware di protezione: va messo davanti a qualunque rotta che
// vogliamo accessibile SOLO a chi ha fatto login.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // es. "Bearer eyJhbGciOi..."

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token mancante" });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, JWT_SECRET); // lancia un errore se il token non è valido o è scaduto
    next(); // token ok: passa alla rotta vera e propria
  } catch (error) {
    res.status(401).json({ error: "Token non valido o scaduto" });
  }
}

// --- ROTTE (endpoint dell'API) ---

// GET /api/images
// Legge il contenuto della cartella "uploads" e restituisce
// l'elenco dei file come JSON, così il frontend sa quali
// immagini mostrare e da che URL scaricarle.
app.get("/api/images", (req, res) => {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Impossibile leggere le immagini" });
    }
    // Escludiamo i file "nascosti" come .gitkeep, che non sono
    // immagini caricate dagli utenti ma solo un trucco per far
    // tracciare a Git la cartella "uploads" anche quando è vuota.
    const imageFiles = files.filter((filename) => !filename.startsWith("."));

    // Costruiamo l'URL completo a partire dalla richiesta stessa
    // (protocollo + host) invece di scriverlo fisso: così funziona
    // sia in locale (http://localhost:3001) sia online dietro un
    // dominio vero (https://tuodominio.it), senza dover cambiare
    // codice tra sviluppo e produzione.
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const images = imageFiles.map((filename) => ({
      filename,
      url: `${baseUrl}/uploads/${filename}`,
    }));
    res.json(images);
  });
});

// POST /api/upload
// Riceve UN file (campo chiamato "image" nel form) grazie al
// middleware upload.single("image"), lo salva su disco (lo fa
// multer automaticamente) e risponde con i dati del file salvato.
// "requireAuth" viene eseguito PRIMA: se il token non è valido,
// la richiesta si ferma lì e multer non viene nemmeno chiamato.
app.post("/api/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nessuna immagine ricevuta" });
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    filename: req.file.filename,
    url: `${baseUrl}/uploads/${req.file.filename}`,
  });
});

// --- SERVIRE IL SITO REACT GIÀ "BUILDATO" (solo in produzione) ---
//
// In sviluppo, il sito gira separatamente con "npm run dev" dentro
// /client (porta 5173) e questa cartella non esiste. In produzione,
// invece, buildiamo React in file statici (client/dist) e li
// serviamo direttamente da qui: un solo processo, una sola porta,
// più semplice da mettere dietro un reverse proxy come Nginx Proxy
// Manager. Il controllo con existsSync fa sì che, in locale, questo
// blocco venga semplicemente ignorato.
const CLIENT_DIST_DIR = path.join(__dirname, "..", "client", "dist");

if (fs.existsSync(CLIENT_DIST_DIR)) {
  app.use(express.static(CLIENT_DIST_DIR));

  // Qualunque richiesta GET non ancora gestita sopra (non un'immagine,
  // non una rotta /api/...) riceve comunque index.html: è React,
  // lato browser, a occuparsi di cosa mostrare.
  app.use((req, res) => {
    res.sendFile(path.join(CLIENT_DIST_DIR, "index.html"));
  });
}

// Avvia il server e lo mette in ascolto sulla porta scelta.
app.listen(PORT, () => {
  console.log(`Server backend in ascolto su http://localhost:${PORT}`);
});
