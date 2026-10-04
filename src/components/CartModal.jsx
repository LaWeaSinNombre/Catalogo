import { CONFIG } from "../config";
import { formatCurrency } from "../utils/formatters";

export default function CartModal({ cart, totalPrice, onClose, onChangeQty, onSendWhatsApp }) {
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

        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--mut)" }}>
              El carrito está vacío 🌸
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.key} className="cart-item">
                <img
                  src={item.imagen}
                  alt=""
                  onError={(e) => (e.target.src = CONFIG.defaultImg)}
                />
                <div className="cart-item-info">
                  <strong>{item.nombre}</strong>
                  <small>
                    {item.tipo} - {formatCurrency(item.precio)} c/u
                  </small>
                </div>
                <div className="cart-qty-ctrl">
                  <button onClick={() => onChangeQty(idx, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => onChangeQty(idx, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <strong>{formatCurrency(totalPrice)}</strong>
          </div>
          <button
            className="cart-send-btn"
            disabled={cart.length === 0}
            onClick={onSendWhatsApp}
          >
            Enviar Pedido por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}