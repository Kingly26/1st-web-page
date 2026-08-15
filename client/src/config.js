// Indirizzo del backend (il server Express che abbiamo creato in /server).
// Tenerlo in un unico posto evita di riscrivere l'URL in ogni componente:
// se un domani il backend gira su un altro indirizzo, si cambia solo qui.
//
// import.meta.env.DEV è una variabile che Vite imposta automaticamente:
// true quando giri "npm run dev" in locale, false quando fai la build
// di produzione ("npm run build"). In produzione il backend Express
// servirà anche i file del sito React (stessa origine), quindi basta
// un indirizzo relativo ("") invece di "http://localhost:3001".
export const API_URL = import.meta.env.DEV ? "http://localhost:3001" : "";
