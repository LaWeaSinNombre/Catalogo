export default function Footer({ curPage, totalPages, goToPage }) {
  return (
    <footer>
      <button disabled={curPage === 0} onClick={() => goToPage(curPage - 1)}>
        Anterior
      </button>
      <span className="page-counter">
        {curPage + 1} / {totalPages}
      </span>
      <button
        disabled={curPage === totalPages - 1}
        onClick={() => goToPage(curPage + 1)}
      >
        Siguiente
      </button>
    </footer>
  );
}