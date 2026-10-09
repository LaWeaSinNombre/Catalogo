import { useState, useEffect } from "react";
import { CONFIG } from "../config";
import { formatCurrency } from "../utils/formatters";

export default function CartModal({
  cart = [],
  allProducts = [],
  checkAndUpdateCatalog,
  onClose,
  onChangeQty,
  onSendWhatsApp
}) {
  const [isChecking, setIsChecking] = useState(true);

  // Asegurar que siempre trabajemos con arreglos válidos
  const safeCart = Array.isArray(cart) ? cart : [];
  const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];

  // Al abrir el modal, forzar la comprobación de versión contra la base de datos
  useEffect(() => {
    let isMounted = true;

    const verifyPrices = async () => {
      setIsChecking(true);
      if (typeof checkAndUpdateCatalog === "function") {
        try {
          await checkAndUpdateCatalog();
        } catch (err) {
          console.error("Error al verificar precios:", err);
        }
      }
      if (isMounted) {
        setIsChecking(false);
      }
    };

    verifyPrices();

    return () => {
      isMounted = false;
    };
  }, [checkAndUpdateCatalog]);

  // Comparar los artículos del carrito con los productos actualizados del catálogo
  const verifiedItems = safeCart
    .map((item) => {
      if (!item) return null;

      const currentProd = safeAllProducts.find(
        (p) => p && ((p.id !== undefined && p.id === item.id) || p._idx === item._idx || p.nombre === item.nombre)
      );

      if (!currentProd) {
        return { ...item, currentPrice: item.precio || 0, isMissing: true };
      }

      const estado = (currentProd.estado || "").toString().toLowerCase().trim();
      const isOutOfStock =
        estado === "sin stock" || estado === "agotado" || estado === "pausada" || estado === "pausado";

      // Obtener precio actual según la presentación seleccionada
      const isUnit = item.tipo === "Unidad";
      const currentPrice = isUnit
        ? Number(currentProd.precio_unitario || 0)
        : Number(currentProd.precio_bulto || 0);

      const oldPrice = Number(item.precio || 0);
      const priceChanged = currentPrice > 0 && currentPrice !== oldPrice;

      return {
        ...item,
        currentPrice: currentPrice > 0 ? currentPrice : oldPrice,
        oldPrice,
        priceChanged,
        isOutOfStock,
        currentProd
      };
    })
    .filter(Boolean);

  // Recalcular el total considerando los precios actualizados
  const verifiedTotalPrice = verifiedItems.reduce((sum, item) => {
    const priceToUse = item.priceChanged ? item.currentPrice : item.oldPrice;
    return sum + priceToUse * (item.qty || 1);
  }, 0);

  const hasPriceChanges = verifiedItems.some((item) => item.priceChanged);
  const hasOutOfStockItems = verifiedItems.some((item) => item.isOutOfStock);

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="cart-header">
          <h3>Carrito de Compras</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Notificación si hubo cambios de precios */}
        {!isChecking && hasPriceChanges && (
          <div style={{
            background: "rgba(241, 196, 15, 0.15)",
            border: "1px solid #f1c40f",
            color: "#f39c12",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            margin: "8px 16px 0 16px"
          }}>
            ⚠️ Algunos precios en tu carrito se han actualizado con la última versión del catálogo.
          </div>
        )}

        {/* Notificación si hay productos agotados */}
        {!isChecking && hasOutOfStockItems && (
          <div style={{
            background: "rgba(231, 76, 60, 0.15)",
            border: "1px solid #e74c3c",
            color: "#e74c3c",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            margin: "8px 16px 0 16px"
          }}>
            🚫 Hay productos agotados en tu carrito. Retíralos para poder enviar el pedido.
          </div>
        )}

        <div className="cart-items">
          {verifiedItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--mut)" }}>
              El carrito está vacío 🌸
            </div>
          ) : (
            verifiedItems.map((item, idx) => {
              const activePrice = item.priceChanged ? item.currentPrice : item.oldPrice;
              const imgSrc = item.imagen_url || item.imagen || CONFIG?.defaultImg || "default-perfume.png";

              return (
                <div key={item.key || idx} className="cart-item" style={{ opacity: item.isOutOfStock ? 0.6 : 1 }}>
                  <img
                    src={imgSrc}
                    alt={item.nombre || "Producto"}
                    onError={(e) => (e.target.src = CONFIG?.defaultImg || "default-perfume.png")}
                  />
                  <div className="cart-item-info">
                    <strong>{item.nombre}</strong>
                    <small>
                      {item.tipo} - {formatCurrency(activePrice)} c/u
                    </small>

                    {/* Badge de precio actualizado */}
                    {item.priceChanged && (
                      <span style={{ display: "block", color: "#f39c12", fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                        ⚠️ Precio anterior: {formatCurrency(item.oldPrice)}
                      </span>
                    )}

                    {/* Badge de agotado */}
                    {item.isOutOfStock && (
                      <span style={{ display: "block", color: "#e74c3c", fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                        🔴 Agotado / Sin stock
                      </span>
                    )}
                  </div>

                  <div className="cart-qty-ctrl">
                    <button onClick={() => onChangeQty && onChangeQty(idx, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => onChangeQty && onChangeQty(idx, 1)} disabled={item.isOutOfStock}>+</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <strong>{formatCurrency(verifiedTotalPrice)}</strong>
          </div>
          <button
            className="cart-send-btn"
            disabled={safeCart.length === 0 || hasOutOfStockItems || isChecking}
            onClick={onSendWhatsApp}
          >
            {isChecking ? "Verificando precios..." : "Enviar Pedido por WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}