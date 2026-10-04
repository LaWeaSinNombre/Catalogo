import { useState, useEffect, useRef } from "react";
import { CONFIG } from "../config";

export default function Header({
  searchTerm,
  setSearchTerm,
  searchResults,
  goToPage,
  sections
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Detectar clics fuera del buscador para ocultar el desplegable
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header>
      <h1>{CONFIG.brandName}</h1>

      <div className="search-container" ref={searchRef}>
        <input
          type="text"
          placeholder="Buscar perfume..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchTerm.trim()) setIsOpen(true);
          }}
        />

        {isOpen && searchTerm.trim() && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div style={{ padding: 12, textAlign: "center", color: "var(--mut)" }}>
                No se encontraron productos
              </div>
            ) : (
              searchResults.map((p) => (
                <div
                  key={p._idx}
                  className="search-item"
                  onClick={() => {
                    goToPage(p._page);
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                >
                  <img
                    src={p.imagen || CONFIG.defaultImg}
                    onError={(e) => (e.target.src = CONFIG.defaultImg)}
                    alt=""
                  />
                  <div className="search-item-info">
                    <strong>{p.nombre}</strong>
                    <small>{p.detalles}</small>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mut)" }}>
                    Pág. {p._page + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <select
        value={""}
        onChange={(e) => e.target.value !== "" && goToPage(Number(e.target.value))}
      >
        <option value="">Ir a…</option>
        {sections.map(([title, pageIdx]) => (
          <option key={pageIdx} value={pageIdx}>
            {title}
          </option>
        ))}
      </select>
    </header>
  );
}