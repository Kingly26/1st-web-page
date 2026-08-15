// ============================================================
// COMPONENTE: Gallery
// ============================================================
// Chiede al backend l'elenco delle immagini caricate e le mostra
// in una griglia. Si ricarica ogni volta che la prop "refreshKey"
// cambia (App la incrementa dopo ogni upload riuscito).
// ============================================================

import { useEffect, useState } from "react";
import { API_URL } from "../config";

function Gallery({ refreshKey }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect esegue questa funzione ogni volta che uno dei valori
  // nell'array di dipendenze [refreshKey] cambia (e anche una volta
  // al primo render). È così che la galleria "sa" quando rileggere
  // l'elenco immagini dal backend.
  useEffect(() => {
    setLoading(true);

    fetch(`${API_URL}/api/images`)
      .then((response) => response.json())
      .then((data) => {
        setImages(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Errore nel caricare le immagini:", error);
        setLoading(false);
      });
  }, [refreshKey]);

  if (loading) {
    return <p className="gallery-status">Caricamento immagini...</p>;
  }

  if (images.length === 0) {
    return <p className="gallery-status">Nessuna immagine caricata ancora.</p>;
  }

  return (
    <div className="gallery-grid">
      {images.map((image) => (
        // "key" è obbligatoria in React quando si genera una lista di
        // elementi con .map(): aiuta React a capire quale elemento è
        // quale tra un render e l'altro, senza doverli ridisegnare tutti.
        <div className="gallery-item" key={image.filename}>
          <img src={image.url} alt={image.filename} />
        </div>
      ))}
    </div>
  );
}

export default Gallery;
