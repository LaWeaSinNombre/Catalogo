import { CONFIG } from "../config";
import { formatCurrency } from "../utils/formatters";

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  // Cambiado de product.imagen a product.imagen_url
  const imgSrc = product.imagen_url?.trim() ? product.imagen_url : CONFIG.defaultImg;
  const estado = (product.estado || "").toString().toLowerCase().trim();
  const isAvailable =
    estado !== "sin stock" && estado !== "agotado" && estado !== "pausada" && estado !== "pausado";

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content" style={{ padding: 20 }}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <img
          src={imgSrc}
          alt={product.nombre}
          style={{ width: "100%", borderRadius: 12, height: 220, objectFit: "cover" }}
          onError={(e) => (e.target.src = CONFIG.defaultImg)}
        />

        <h2 style={{ marginTop: 12, marginBottom: 4 }}>{product.nombre}</h2>
        <p style={{ color: "var(--mut)", fontSize: 13, margin: "0 0 12px 0" }}>
          {product.detalles}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg)",
              padding: 10,
              borderRadius: 10
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--mut)" }}>Por Unidad</span>
              <br />
              <strong>{formatCurrency(product.precio_unitario)}</strong>
            </div>
            {isAvailable ? (
              <button
                style={{ background: "#5b3a8e", color: "#fff" }}
                onClick={() => onAddToCart(product, "Unidad")}
              >
                + Agregar
              </button>
            ) : (
              <span style={{ color: "#e74c3c", fontWeight: 700, fontSize: 12 }}>
                Sin Stock
              </span>
            )}
          </div>

          {/* Cambiado de product.empaque_bulto a product.empaque */}
          {product.empaque && Number(product.precio_bulto) > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg)",
                padding: 10,
                borderRadius: 10
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: "var(--mut)" }}>
                  {product.empaque}
                </span>
                <br />
                <strong>{formatCurrency(product.precio_bulto)}</strong>
              </div>
              {isAvailable ? (
                <button
                  style={{ background: "#5b3a8e", color: "#fff" }}
                  onClick={() => onAddToCart(product, product.empaque)}
                >
                  + Agregar
                </button>
              ) : (
                <span style={{ color: "#e74c3c", fontWeight: 700, fontSize: 12 }}>
                  Sin Stock
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}