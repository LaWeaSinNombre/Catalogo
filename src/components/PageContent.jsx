import ProductCard from "./ProductCard";

export default function PageContent({ pageData, pageNum, sections, onSelectProduct, goToPage }) {
  if (pageData === "cover") {
    return (
      <div className="pg cover">
        <div className="em">🌸</div>
        <h2>
          Catálogo<br />de Perfumes
        </h2>
        <p>Precios por unidad y por caja</p>
      </div>
    );
  }

  if (pageData === "index") {
    return (
      <div className="pg">
        <div className="ix">
          <h2>Índice</h2>
          {sections.map(([title, pageIdx]) => (
            <div key={pageIdx} onClick={() => goToPage(pageIdx)}>
              <span>{title}</span>
              <span className="search-item-page">Pág. {pageIdx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pageData === "how") {
    return (
      <div className="pg">
        <div className="how">
          <h2>¿Cómo pedir?</h2>
          <div className="how-steps">
            <div className="how-step">
              <span className="step-num">1</span>
              <div>
                <strong>Explorá el catálogo</strong>
                <p>Toca cualquier perfume para ver sus detalles completos y precios.</p>
              </div>
            </div>

            <div className="how-step">
              <span className="step-num">2</span>
              <div>
                <strong>Seleccioná las cantidades</strong>
                <p>Elegí la cantidad por unidad o por bulto/caja y sumalo al carrito.</p>
              </div>
            </div>

            <div className="how-step">
              <span className="step-num">3</span>
              <div>
                <strong>Enviá tu pedido</strong>
                <p>Tocá el botón flotante del carrito y presioná <b>Enviar Pedido por WhatsApp</b>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (Array.isArray(pageData)) {
    return (
      <div className="pg">
        <div className="hd">
          <span>Catálogo de Perfumes</span>
        </div>
        <div className="bd">
          {pageData.map((item, idx) =>
            item.b ? (
              <div key={idx} className="ban">
                {item.b}
              </div>
            ) : (
              <div key={idx} className="row">
                {item.r.map((prod) => (
                  <ProductCard
                    key={prod._idx}
                    product={prod}
                    onClick={() => onSelectProduct(prod)}
                  />
                ))}
              </div>
            )
          )}
        </div>
        <div className="ft">
          <span></span>
          <span>{pageNum + 1}</span>
        </div>
      </div>
    );
  }

  return null;
}