// ============================================================
// HOOK: useAuth
// ============================================================
// Un "custom hook" è semplicemente una funzione che inizia con
// "use" e che raggruppa logica riutilizzabile basata su altri hook
// di React (qui useState + useEffect). Questo hook gestisce tutto
// ciò che riguarda l'autenticazione: fare login, fare logout, e
// sapere se l'utente è attualmente loggato.
//
// Il token JWT viene salvato in localStorage: è una piccola memoria
// del browser che sopravvive anche se chiudi e riapri la pagina,
// così non devi rifare login ogni volta che ricarichi il sito.
// ============================================================

import { useState } from "react";
import { API_URL } from "../config";

const TOKEN_KEY = "auth_token";

export function useAuth() {
  // Al primo caricamento, controlliamo se c'è già un token salvato
  // da una sessione precedente.
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const isAuthenticated = Boolean(token);

  async function login(username, password) {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Credenziali non valide");
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return { token, isAuthenticated, login, logout };
}
