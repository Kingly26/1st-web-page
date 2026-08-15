// ============================================================
// COMPONENTE: Sidebar
// ============================================================
// Barra laterale del sito. Contiene il logo/titolo e, a seconda
// che l'utente sia loggato o no, mostra il form di login oppure il
// form di upload (più un pulsante di logout). È il componente che
// decide COSA mostrare, ma la LOGICA di autenticazione vive
// nell'hook useAuth, gestito da App e passato qui come props.
// ============================================================

import LoginForm from "./LoginForm";
import UploadForm from "./UploadForm";

function Sidebar({ isAuthenticated, token, onLogin, onLogout, onUploadSuccess }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Kingly Web Developer</h1>
        <p>Galleria full-stack: React + Node/Express</p>
      </div>

      <div className="sidebar-section">
        {isAuthenticated ? (
          <>
            <p className="sidebar-hint">Carica una nuova immagine</p>
            <UploadForm token={token} onUploadSuccess={onUploadSuccess} />
            <button className="logout-button" onClick={onLogout}>
              Esci
            </button>
          </>
        ) : (
          <LoginForm onLogin={onLogin} />
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
