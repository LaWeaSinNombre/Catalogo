import { formatCurrency } from "../utils/formatters";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, onClick }) {
  const estado = (product.estado || "").toString().toLowerCase().trim();

  let badgeText = "";
  let extraClass = "";

  if (estado === "sin stock" || estado === "agotado") {
    badgeText = "AGOTADO";
    extraClass = "out-of-stock";
  } else if (estado === "pausada" || estado === "pausado") {
    badgeText = "PAUSADO";
    extraClass = "paused";
  }

  return (
    <div className={`c ${extraClass}`} onClick={onClick}>
      <div className="img-wrap">
        {/* Cambiado de product.imagen a product.imagen_url */}
        <ProductImage src={product.imagen_url} alt={product.nombre} />
        {badgeText && <div className={`badge-banner ${extraClass}`}>{badgeText}</div>}
      </div>
      <div className="t">
        <b>{product.nombre}</b>
        <small>{product.detalles}</small>
        <div className="pr">
          <span>UNIDAD</span>
          <strong>{formatCurrency(product.precio_unitario)}</strong>
        </div>
        {/* Cambiado de product.empaque_bulto a product.empaque */}
        {product.empaque && Number(product.precio_bulto) > 0 && (
          <div className="pr bx">
            <span>{product.empaque}</span>
            <strong>{formatCurrency(product.precio_bulto)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}