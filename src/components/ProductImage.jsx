import { useState } from "react";
import { CONFIG } from "../config";
import { isUrlBroken, markUrlAsBroken } from "../utils/imageCache";

export default function ProductImage({ src, alt }) {
  const defaultImg = CONFIG.defaultImg;
  const cleanSrc = src?.trim();

  const [failed, setFailed] = useState(false);

  // Si la URL está vacía, falló localmente o ya fue marcada como rota
  const isBroken = !cleanSrc || failed || isUrlBroken(cleanSrc);
  const imgSrc = isBroken ? defaultImg : cleanSrc;

  return (
    <img
      src={imgSrc}
      alt={alt || ""}
      loading="eager"
      decoding="async" /* <-- CRUCIAL: Evita que la descodificación congele el giro 3D */
      onError={() => {
        if (cleanSrc) {
          markUrlAsBroken(cleanSrc);
          setFailed(true);
        }
      }}
    />
  );
}