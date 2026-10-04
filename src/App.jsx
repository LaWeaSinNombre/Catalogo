import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CONFIG } from "./config";
import { formatCurrency } from "./utils/formatters";
import { useCatalog } from "./hooks/useCatalog";
import { precheckImage, preloadAndValidateCatalog } from "./utils/imageCache";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import PageContent from "./components/PageContent";
import ProductDetailModal from "./components/ProductDetailModal";
import CartModal from "./components/CartModal";

// --- Constantes de animación fuera del componente ---
const ANIM_DURATION = 450;
const ANIM_SEC = `${ANIM_DURATION / 1000}s`;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function App() {
  const { allProducts, pages, sections, loading, error } = useCatalog();
  const [curPage, setCurPage] = useState(0);

  // Estado para la animación
  const [anim, setAnim] = useState({
    active: false,
    leafPage: null,
    underPage: null,
    transform: "rotateY(0deg)",
    opacity: 1,
    transition: "none"
  });

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [scale, setScale] = useState(1);

  const busyRef = useRef(false);
  const touchStartX = useRef(null);

  const goToPage = useCallback(
    (to) => {
      if (busyRef.current || to < 0 || to >= pages.length || to === curPage) return;
      busyRef.current = true;

      const isNext = to > curPage;

      if (isNext) {
        // --- AVANZAR (NEXT) ---
        setAnim({
          active: true,
          leafPage: curPage,
          underPage: to,
          transform: "rotateY(0deg)",
          opacity: 1,
          transition: "none"
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnim({
              active: true,
              leafPage: curPage,
              underPage: to,
              transform: "rotateY(-100deg)",
              opacity: 0,
              transition: `transform ${ANIM_SEC} ${EASING}, opacity ${ANIM_SEC} ease-in`
            });
          });
        });

        setTimeout(() => {
          setCurPage(to);
          setAnim({
            active: false,
            leafPage: null,
            underPage: null,
            transform: "rotateY(-100deg)",
            opacity: 0,
            transition: "none"
          });
          busyRef.current = false;
        }, ANIM_DURATION + 20);
      } else {
        // --- RETROCEDER (PREV) ---
        setAnim({
          active: true,
          leafPage: to,
          underPage: curPage,
          transform: "rotateY(-100deg)",
          opacity: 0,
          transition: "none"
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnim({
              active: true,
              leafPage: to,
              underPage: curPage,
              transform: "rotateY(0deg)",
              opacity: 1,
              transition: `transform ${ANIM_SEC} ${EASING}, opacity ${ANIM_SEC} ease-out`
            });
          });
        });

        setTimeout(() => {
          setCurPage(to);
          setAnim({
            active: false,
            leafPage: null,
            underPage: null,
            transform: "rotateY(0deg)",
            opacity: 1,
            transition: "none"
          });
          busyRef.current = false;
        }, ANIM_DURATION + 20);
      }
    },
    [curPage, pages.length]
  );

  // 1. Optimización del cálculo de escala para evitar Reflows constantes en el DOM
  useEffect(() => {
    const handleResize = () => {
      const hh = 124;
      const s = Math.min((window.innerWidth - 24) / 1000, (window.innerHeight - hh) / 1414);
      setScale(Math.max(s, 0.15));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === " ") goToPage(curPage + 1);
      else if (e.key === "ArrowLeft") goToPage(curPage - 1);
      else if (e.key === "Home") goToPage(0);
      else if (e.key === "End") goToPage(pages.length - 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [curPage, pages.length, goToPage]);

  // 2. Validación global en segundo plano de todo el catálogo al cargar los productos
  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      preloadAndValidateCatalog(allProducts);
    }
  }, [allProducts]);

  // 3. Precarga de imágenes diferida en páginas adyacentes
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    const timer = setTimeout(() => {
      const pageIndicesToPrecheck = [curPage - 1, curPage, curPage + 1].filter(
        (idx) => idx >= 0 && idx < pages.length
      );

      pageIndicesToPrecheck.forEach((pageIdx) => {
        const pageData = pages[pageIdx];
        if (!Array.isArray(pageData)) return;

        pageData.forEach((block) => {
          if (block.r && Array.isArray(block.r)) {
            block.r.forEach((prod) => {
              if (prod?.imagen) {
                precheckImage(prod.imagen);
              }
            });
          }
        });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [curPage, pages]);

  // 4. Resultados de búsqueda memorizados con useMemo
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(term) ||
        p.detalles?.toLowerCase().includes(term) ||
        p.categoria?.toLowerCase().includes(term)
    );
  }, [searchTerm, allProducts]);

  // 5. Totales del carrito memorizados en un solo paso
  const { totalCartItems, totalCartPrice } = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        acc.totalCartItems += item.qty;
        acc.totalCartPrice += item.precio * item.qty;
        return acc;
      },
      { totalCartItems: 0, totalCartPrice: 0 }
    );
  }, [cart]);

  const showToast = (msg = "Producto agregado 🌸") => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const addToCart = (prod, tipo) => {
    const precio = tipo === "Unidad" ? Number(prod.precio_unitario) : Number(prod.precio_bulto);
    const key = `${prod._idx}_${tipo}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.key === key);
      if (existing) {
        return prevCart.map((item) =>
          item.key === key ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          key,
          prodIndex: prod._idx,
          nombre: prod.nombre,
          tipo,
          precio,
          imagen: prod.imagen || CONFIG.defaultImg,
          qty: 1
        }
      ];
    });

    showToast();
  };

  const changeQty = (index, delta) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      updated[index].qty += delta;
      if (updated[index].qty <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const sendWhatsApp = () => {
    if (cart.length === 0) return;

    let text = "🌸 *NUEVO PEDIDO DE CATÁLOGO*\n\n";
    let total = 0;

    cart.forEach((item) => {
      const subtotal = item.precio * item.qty;
      total += subtotal;
      text += `• *${item.qty}x* ${item.nombre} (${item.tipo}) - ${formatCurrency(subtotal)}\n`;
    });

    text += `\n*TOTAL ESTIMADO:* ${formatCurrency(total)}\n\n`;
    text += "¡Hola! Quisiera coordinar el pago y envío de este pedido.";

    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      goToPage(curPage + (diff < 0 ? 1 : -1));
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <h2>Cargando catálogo... 🌸</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <h2>{error}</h2>
      </div>
    );
  }

  const displayUnderPage = anim.active ? anim.underPage : curPage;

  return (
    <div className="app-container">
      {toastMessage && <div className="toast">{toastMessage}</div>}

      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        goToPage={goToPage}
        sections={sections}
      />

      <main>
        <div
          id="book"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            "--s": scale,
            width: `${1000 * scale}px`,
            height: `${1414 * scale}px`,
            perspective: "3000px"
          }}
        >
          {/* Navegación lateral */}
          <div className="nav l" onClick={() => goToPage(curPage - 1)} />
          <div className="nav r" onClick={() => goToPage(curPage + 1)} />

          {/* 1. Capa de Fondo */}
          <div className="L" style={{ zIndex: 1 }}>
            {pages[displayUnderPage] && (
              <PageContent
                pageData={pages[displayUnderPage]}
                pageNum={displayUnderPage}
                sections={sections}
                onSelectProduct={(prod) => setSelectedProduct(prod)}
                goToPage={goToPage}
              />
            )}
          </div>

          {/* 2. Capa Hoja Animada (#leaf) */}
          <div
            id="leaf"
            className="L"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transformOrigin: "0% 50%",
              WebkitTransformOrigin: "0% 50%",
              backfaceVisibility: "hidden",
              pointerEvents: "none",
              zIndex: 10,
              display: anim.active ? "block" : "none",
              transform: anim.transform,
              opacity: anim.opacity,
              transition: anim.transition
            }}
          >
            {anim.leafPage !== null && pages[anim.leafPage] && (
              <PageContent
                pageData={pages[anim.leafPage]}
                pageNum={anim.leafPage}
                sections={sections}
                onSelectProduct={(prod) => setSelectedProduct(prod)}
                goToPage={goToPage}
              />
            )}
          </div>
        </div>
      </main>

      <Footer
        curPage={curPage}
        totalPages={pages.length}
        goToPage={goToPage}
      />

      <button id="cart-float-btn" onClick={() => setIsCartOpen(true)}>
        🛒 Carrito <span>{totalCartItems}</span>
      </button>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {isCartOpen && (
        <CartModal
          cart={cart}
          totalPrice={totalCartPrice}
          onClose={() => setIsCartOpen(false)}
          onChangeQty={changeQty}
          onSendWhatsApp={sendWhatsApp}
        />
      )}
    </div>
  );
}