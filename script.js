const $ = i => document.getElementById(i);
const m = n => "$" + (n || 0).toLocaleString("es-AR");

// 1. Ruta de tu imagen por defecto
const DEFAULT_IMG = "default-perfume.png";

// 2. Precargar inmediatamente la imagen por defecto en la memoria del navegador
const defaultImgPreload = new Image();
defaultImgPreload.src = DEFAULT_IMG;

let cur = 0;
let N = 0;
let busy = false;
let PG = [];
let SECS = [];
let allProducts = [];

// Precarga e inspección de imágenes en segundo plano (repara links rotos en memoria)
function preloadImages(productos) {
  productos.forEach(p => {
    if (p.imagen && p.imagen.trim() !== "" && p.imagen !== DEFAULT_IMG) {
      const img = new Image();
      img.onload = () => {};
      img.onerror = () => {
        // Si el link de Google Sheets está roto, lo reemplazamos directamente en memoria
        p.imagen = DEFAULT_IMG;
      };
      img.src = p.imagen;
    } else {
      p.imagen = DEFAULT_IMG;
    }
  });
}

// Renderizado de tarjeta de producto
const card = (d) => {
  const imgSrc = d.imagen && d.imagen.trim() !== "" ? d.imagen : DEFAULT_IMG;
  const estado = (d.estado || "").toString().toLowerCase().trim();

  let badgeHtml = "";
  let extraClass = "";

  if (estado === "sin stock" || estado === "agotado") {
    badgeHtml = `<div class="badge-banner sin-stock">AGOTADO</div>`;
    extraClass = "out-of-stock";
  } else if (estado === "pausada" || estado === "pausado") {
    badgeHtml = `<div class="badge-banner pausado">PAUSADO</div>`;
    extraClass = "paused";
  }

  return `
    <div class="c ${extraClass}">
      <div class="img-wrap">
        <img alt="" 
             src="${imgSrc}" 
             loading="eager" 
             decoding="async" 
             onerror="this.onerror=null; this.src='${DEFAULT_IMG}'; if(window.allProducts && window.allProducts[${d._idx}]) window.allProducts[${d._idx}].imagen='${DEFAULT_IMG}';">
        ${badgeHtml}
      </div>
      <div class="t">
        <b>${d.nombre}</b>
        <small>${d.detalles}</small>
        <div class="pr">
          <span>UNIDAD</span>
          <strong>${m(d.precio_unitario)}</strong>
        </div>
        ${d.empaque_bulto && d.precio_bulto > 0 ? `
          <div class="pr bx">
            <span>${d.empaque_bulto}</span>
            <strong>${m(d.precio_bulto)}</strong>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

function page(n) {
  const p = PG[n];

  if (p === "cover") {
    return `<div class="pg cover"><div class="em">🌸</div><h2>Catálogo<br>de Perfumes</h2><p>Precios por unidad y por caja</p></div>`;
  }
  if (p === "index") {
    return `
      <div class="pg">
        <div class="ix">
          <h2>Índice</h2>
          ${SECS.map(s => `<div onclick="flip(${s[1]})"><span>${s[0]}</span><span>${s[1] + 1}</span></div>`).join("")}
        </div>
      </div>
    `;
  }
  if (p === "how") {
    return `<div class="pg"><div class="how"><h2>¿Cómo pedir?</h2><p>1. Hacé captura de pantalla del perfume.</p><p>2. Envianos por WhatsApp la foto y la cantidad que querés.</p></div></div>`;
  }

  return `
    <div class="pg">
      <div class="hd"><span>Catálogo de Perfumes</span></div>
      <div class="bd">
        ${p.map(e => e.b ? `<div class="ban">${e.b}</div>` : `<div class="row">${e.r.map(card).join("")}</div>`).join("")}
      </div>
      <div class="ft"><span></span><span>${n + 1}</span></div>
    </div>
  `;
}

function fit() {
  const hh = document.querySelector("header").offsetHeight + document.querySelector("footer").offsetHeight + 24;
  const s = Math.min((innerWidth - 24) / 1000, (innerHeight - hh) / 1414);
  const b = $("book");
  b.style.setProperty("--s", s);
  b.style.width = (1000 * s) + "px";
  b.style.height = (1414 * s) + "px";
}

function show() {
  $("under").innerHTML = page(cur);
  $("cnt").textContent = (cur + 1) + " / " + N;
  $("bp").disabled = !cur;
  $("bn").disabled = cur === N - 1;
  $("jump").value = "";
}

function flip(to) {
  if (busy || to < 0 || to >= N || to === cur) return;
  busy = true;
  const f = to > cur;
  const l = $("leaf");

  if (f) {
    $("under").innerHTML = page(to);
    l.innerHTML = page(cur);
    l.style.transition = "none";
    l.style.transform = "rotateY(0)";
    l.style.opacity = 1;
    l.className = "";
    l.style.display = "block";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      l.style.transition = "transform .7s cubic-bezier(.5,0,.3,1), opacity .7s";
      l.className = "go";
      l.style.transform = "rotateY(-100deg)";
      l.style.opacity = 0;
    }));
  } else {
    l.innerHTML = page(to);
    l.style.transition = "none";
    l.style.transform = "rotateY(-100deg)";
    l.style.opacity = 0;
    l.className = "go";
    l.style.display = "block";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      l.style.transition = "transform .7s cubic-bezier(.3,0,.5,1), opacity .5s .2s";
      l.className = "";
      l.style.transform = "rotateY(0)";
      l.style.opacity = 1;
    }));
  }

  setTimeout(() => {
    cur = to;
    show();
    l.style.display = "none";
    busy = false;
  }, 720);
}

const go = d => flip(cur + d);

function buildPages(productos) {
  // Filtrar productos que "se dejaron de vender"
  const productosVisibles = productos.filter(p => {
    const st = (p.estado || "").toString().toLowerCase().trim();
    return st !== "se dejo de vender" && st !== "se dejó de vender" && st !== "desactivado";
  });

  // Asignar un índice único a cada producto para el rastreo de errores
  productosVisibles.forEach((prod, i) => {
    prod._idx = i;
  });

  allProducts = productosVisibles;

  // Precargar imágenes e identificar links rotos en segundo plano
  preloadImages(productosVisibles);

  PG = ["cover", "index", "how"];
  SECS = [
    ["Índice", 1],
    ["¿Cómo pedir?", 2]
  ];

  const categoriasMap = {};
  productosVisibles.forEach(prod => {
    const cat = prod.categoria && prod.categoria.trim() !== "" ? prod.categoria : "General";
    if (!categoriasMap[cat]) categoriasMap[cat] = [];
    categoriasMap[cat].push(prod);
  });

  Object.keys(categoriasMap).forEach(catName => {
    const prodsInCat = categoriasMap[catName];
    const startPageIndex = PG.length;

    SECS.push([catName, startPageIndex]);

    const rows = [];
    for (let i = 0; i < prodsInCat.length; i += 2) {
      rows.push({ r: prodsInCat.slice(i, i + 2) });
    }

    let rowIdx = 0;
    let isFirstPage = true;

    while (rowIdx < rows.length) {
      const pageContent = [];
      const currentPageIndex = PG.length;

      let pageRows = [];
      if (isFirstPage) {
        pageContent.push({ b: catName });
        pageRows = rows.slice(rowIdx, rowIdx + 3);
        rowIdx += 3;
        isFirstPage = false;
      } else {
        pageRows = rows.slice(rowIdx, rowIdx + 4);
        rowIdx += 4;
      }

      pageRows.forEach(r => {
        pageContent.push(r);
        r.r.forEach(prod => {
          prod._page = currentPageIndex;
        });
      });

      PG.push(pageContent);
    }
  });

  N = PG.length;

  $("jump").innerHTML = '<option value="">Ir a…</option>' + SECS.map(s => `<option value="${s[1]}">${s[0]}</option>`).join("");
}

function setupSearch() {
  const input = $("searchInput");
  const resultsBox = $("searchResults");

  input.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();

    if (term === "") {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    const matches = allProducts.filter(p => 
      (p.nombre && String(p.nombre).toLowerCase().includes(term)) ||
      (p.detalles && String(p.detalles).toLowerCase().includes(term)) ||
      (p.categoria && String(p.categoria).toLowerCase().includes(term))
    );

    if (matches.length === 0) {
      resultsBox.innerHTML = `<div class="no-search-results">No se encontraron productos</div>`;
    } else {
      resultsBox.innerHTML = matches.map(p => {
        const imgSrc = p.imagen && p.imagen.trim() !== "" ? p.imagen : DEFAULT_IMG;
        return `
          <div class="search-item" onclick="selectSearchResult(${p._page})">
            <img src="${imgSrc}" onerror="this.onerror=null;this.src='${DEFAULT_IMG}'">
            <div class="search-item-info">
              <strong>${p.nombre}</strong>
              <small>${p.detalles}</small>
            </div>
            <span class="search-item-page">Pág. ${p._page + 1}</span>
          </div>
        `;
      }).join("");
    }

    resultsBox.classList.add("active");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      resultsBox.classList.remove("active");
    }
  });
}

window.selectSearchResult = (pageIndex) => {
  $("searchResults").classList.remove("active");
  $("searchInput").value = "";
  flip(pageIndex);
};

async function loadCatalog() {
  const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbw3FTxexsblCzyIXSDGso0V57tnfp9Nzbsuqh2tt7g9FcuBYNvnazcQrhvzTc5a9R8O/exec";
  
  const CACHE_KEY = "catalogo_perfumes_data";
  const CACHE_TIME_KEY = "catalogo_perfumes_time";
  const CACHE_TTL = 5 * 60 * 1000;

  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();

  const isCacheValid = cachedData && cachedTime && (now - Number(cachedTime) < CACHE_TTL);

  if (isCacheValid) {
    try {
      const data = JSON.parse(cachedData);
      buildPages(data);
      setupSearch();
      fit();
      show();
      return;
    } catch (e) {
      console.warn("Caché dañado, obteniendo datos nuevos...");
    }
  }

  try {
    const res = await fetch(GOOGLE_SHEETS_URL);
    if (!res.ok) throw new Error("Error " + res.status);
    const data = await res.json();

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());

    buildPages(data);
    setupSearch();
    fit();
    show();
  } catch (err) {
    console.error("Error al cargar los datos desde Google Sheets:", err);

    if (cachedData) {
      const data = JSON.parse(cachedData);
      buildPages(data);
      setupSearch();
      fit();
      show();
    } else {
      $("under").innerHTML = `<div class="pg"><div class="how"><h2>Error</h2><p>No se pudieron cargar los datos de Google Sheets.</p></div></div>`;
    }
  }
}

// Eventos de Navegación
$("bn").onclick = $("pr").onclick = () => go(1);
$("bp").onclick = $("pl").onclick = () => go(-1);

$("jump").onchange = e => {
  if (e.target.value !== "") flip(+e.target.value);
};

addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight" || e.key === " ") go(1);
  else if (e.key === "ArrowLeft") go(-1);
  else if (e.key === "Home") flip(0);
  else if (e.key === "End") flip(N - 1);
});

let sx = null;
const bk = $("book");
bk.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
bk.addEventListener("touchend", e => {
  if (sx === null) return;
  const d = e.changedTouches[0].clientX - sx;
  sx = null;
  if (Math.abs(d) > 40) go(d < 0 ? 1 : -1);
});

addEventListener("resize", fit);

window.allProducts = allProducts;
window.flip = flip;

loadCatalog();