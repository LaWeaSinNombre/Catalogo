const CONFIG = {
  // Configuración del repositorio de GitHub
  // (Tu hermano solo debe cambiar "githubUser" cuando clone el proyecto)
  githubUser: "laweasinnombre",
  repoName: "Catalogo",

  // Datos de marca y archivos
  brandName: "Nombre de tu Marca",
  pdfFile: "Catalogo.pdf",
  faviconFile: "favicon.png",

  // Construye la URL pública para producción
  getPublicPdfUrl: function () {
    return `https://${this.githubUser}.github.io/${this.repoName}/${this.pdfFile}`;
  }
};