// ============================================================
// COMPONENTE: UploadForm
// ============================================================
// Form che permette di scegliere un'immagine dal computer e
// inviarla al backend. Quando l'upload va a buon fine, avvisa
// il componente genitore (App) tramite la funzione "onUploadSuccess"
// passata come prop, così App può dire alla Gallery di aggiornarsi.
// ============================================================

import { useState } from "react";
import { API_URL } from "../config";

function UploadForm({ token, onUploadSuccess }) {
  // "file" tiene in memoria l'immagine scelta dall'utente prima dell'invio.
  const [file, setFile] = useState(null);
  // "status" serve solo per mostrare un messaggio (idle / loading / error).
  const [status, setStatus] = useState("idle");

  // Chiamata ogni volta che l'utente seleziona un file nell'<input>.
  function handleFileChange(event) {
    // event.target.files è un elenco di file scelti; noi ne prendiamo solo il primo.
    setFile(event.target.files[0]);
  }

  // Chiamata quando l'utente invia il form (click su "Carica").
  async function handleSubmit(event) {
    event.preventDefault(); // evita che il browser ricarichi la pagina

    if (!file) return;

    setStatus("loading");

    // FormData è il formato che i browser usano per inviare file via HTTP.
    // La chiave "image" deve corrispondere a quella che il backend si
    // aspetta: upload.single("image") in server/index.js.
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          // Il backend richiede questo header per verificare che
          // siamo autenticati (vedi requireAuth in server/index.js).
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        // Nota: NON impostiamo manualmente il Content-Type del body.
        // Il browser lo genera da solo (con il "boundary" corretto)
        // quando il body è un oggetto FormData.
      });

      if (!response.ok) {
        throw new Error("Upload fallito");
      }

      setStatus("idle");
      setFile(null);
      onUploadSuccess(); // avvisa App: "ho finito, aggiorna la galleria"
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {file ? file.name : "Scegli un'immagine..."}
      </label>

      <button type="submit" disabled={!file || status === "loading"}>
        {status === "loading" ? "Caricamento..." : "Carica"}
      </button>

      {status === "error" && (
        <p className="upload-error">Qualcosa è andato storto, riprova.</p>
      )}
    </form>
  );
}

export default UploadForm;
