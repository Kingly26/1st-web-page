// ============================================================
// COMPONENTE: App (radice dell'applicazione React)
// ============================================================
// Layout generale: una Sidebar fissa a sinistra (login o upload) e
// a destra, in primo piano, la Galleria.
//
// L'autenticazione vive nell'hook useAuth: App lo chiama una volta
// e passa i pezzi che servono (isAuthenticated, token, login,
// logout) giù ai componenti figli tramite props. Così sia la
// Sidebar che, indirettamente, la richiesta di upload sanno se
// l'utente è loggato senza doverlo ricalcolare ognuno per conto suo.
// ============================================================

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Gallery from "./components/Gallery";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

function App() {
  const { token, isAuthenticated, login, logout } = useAuth();

  // Stesso pattern di prima: un numero che la Gallery "ascolta" per
  // sapere quando ricaricare l'elenco immagini dal backend.
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploadSuccess() {
    setRefreshKey((previous) => previous + 1);
  }

  return (
    <div className="layout">
      <Sidebar
        isAuthenticated={isAuthenticated}
        token={token}
        onLogin={login}
        onLogout={logout}
        onUploadSuccess={handleUploadSuccess}
      />

      <main className="main-content">
        <h2 className="gallery-title">Galleria</h2>
        <Gallery refreshKey={refreshKey} />
      </main>
    </div>
  );
}

export default App;
