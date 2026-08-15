// ============================================================
// COMPONENTE: LoginForm
// ============================================================
// Semplice form username/password. Chiama la funzione "onLogin"
// (che arriva dall'hook useAuth passato da App) e mostra un
// messaggio se le credenziali sono sbagliate.
// ============================================================

import { useState } from "react";

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(username, password);
      // Se il login va a buon fine, App aggiorna lo stato "isAuthenticated"
      // e questo componente sparisce dalla sidebar, sostituito da UploadForm.
    } catch (err) {
      setError("Username o password errati.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <p className="sidebar-hint">Accedi per caricare nuove immagini.</p>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
      />

      <button type="submit" disabled={loading}>
        {loading ? "Accesso..." : "Accedi"}
      </button>

      {error && <p className="upload-error">{error}</p>}
    </form>
  );
}

export default LoginForm;
