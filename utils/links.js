const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ===============================
// CONFIGURACION
// ===============================
const USER = "sTr4yDev";
const REPO = "calificaciones-app";
const BRANCH = "main";
const TOKEN = ""; // opcional - para evitar rate limiting

// ===============================
// URLs base
// ===============================
const API_URL = `https://api.github.com/repos/${USER}/${REPO}/branches/${BRANCH}`;
const RAW_BASE = `https://raw.githubusercontent.com/${USER}/${REPO}/${BRANCH}/`;

const headers = TOKEN ? { Authorization: `token ${TOKEN}` } : {};

// ===============================
// FUNCIONES AUXILIARES
// ===============================

async function obtenerCommitMasReciente() {
  console.log("[UTIL] Verificando commit mas reciente...");

  const res = await axios.get(API_URL, { headers });

  const sha = res.data.commit.sha;
  const fecha = res.data.commit.commit.committer.date;

  console.log(`[INFO] Commit mas reciente: ${sha.slice(0, 8)} (${fecha})`);
  return sha;
}

function clasificarArchivo(pathFile) {
  const lower = pathFile.toLowerCase();

  // Ignorar archivos específicos
  if (
    lower.includes("node_modules") ||
    lower.includes(".git/") ||
    lower.includes("package-lock.json")
  ) {
    return "ignorar";
  }

  // Backend
  if (
    lower.endsWith(".py") ||
    lower.includes("config.js") ||
    lower.includes("database.js") ||
    lower.includes("server") ||
    lower.includes("models") ||
    lower.includes("routes") ||
    lower.includes("api/")
  ) {
    return "backend";
  }

  // Frontend
  if (
    lower.endsWith(".html") ||
    lower.endsWith(".css") ||
    lower.includes("styles") ||
    lower.includes("renderer.js") ||
    lower.includes("public/") ||
    lower.includes("assets/")
  ) {
    return "frontend";
  }

  // Electron / Main Process
  if (lower.includes("main.js") || lower.includes("preload.js")) {
    return "electron";
  }

  // Documentacion
  if (
    lower.endsWith(".md") ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".docx") ||
    lower.includes("docs/")
  ) {
    return "docs";
  }

  // Utilidades
  if (lower.includes("utils/") || lower.includes("scripts/")) {
    return "utils";
  }

  // Configuracion
  if (
    lower.endsWith("package.json") ||
    lower.endsWith(".json") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".env") ||
    lower.endsWith(".gitignore")
  ) {
    return "config";
  }

  return "otros";
}

function generarContenido(categorias, sha) {
  const lineas = [
    `# RAW LINKS - ${REPO}`,
    `# Actualizado: ${new Date().toISOString()}`,
    `# Repositorio: ${USER}/${REPO}`,
    `# Branch: ${BRANCH}`,
    `# Commit: ${sha}`,
    "",
    "# ===================================================================",
    "# USO: Estos enlaces apuntan directamente a los archivos en GitHub",
    "# Puedes copiarlos y pegarlos en navegador, curl, wget, etc.",
    "# ===================================================================",
    "",
  ];

  const orden = [
    "electron",
    "backend",
    "frontend",
    "docs",
    "utils",
    "config",
    "otros",
  ];
  const titulos = {
    electron: "ELECTRON / MAIN PROCESS",
    backend: "BACKEND / DATABASE",
    frontend: "FRONTEND / UI",
    docs: "DOCUMENTACION",
    utils: "UTILIDADES",
    config: "CONFIGURACION",
    otros: "OTROS ARCHIVOS",
  };

  for (const cat of orden) {
    if (categorias[cat] && categorias[cat].length > 0) {
      lineas.push("");
      lineas.push(`${"=".repeat(25)} ${titulos[cat]} ${"=".repeat(25)}`);
      lineas.push(`# Total: ${categorias[cat].length} archivos`);
      lineas.push("");
      categorias[cat].forEach((url) => lineas.push(url));
    }
  }

  return lineas.join("\n");
}

// ===============================
// FUNCION PRINCIPAL
// ===============================

async function generarRawLinks() {
  const sha = await obtenerCommitMasReciente();

  const treeURL = `https://api.github.com/repos/${USER}/${REPO}/git/trees/${sha}?recursive=1`;

  console.log("[UTIL] Obteniendo estructura del repositorio...");
  const res = await axios.get(treeURL, { headers });

  const archivos = res.data.tree.filter((f) => f.type === "blob");
  console.log(`[INFO] Total de archivos encontrados: ${archivos.length}`);

  const categorias = {
    electron: [],
    backend: [],
    frontend: [],
    docs: [],
    utils: [],
    config: [],
    otros: [],
  };

  let ignorados = 0;

  for (const file of archivos) {
    const url = `${RAW_BASE}${file.path}`;
    const categoria = clasificarArchivo(file.path);

    if (categoria === "ignorar") {
      ignorados++;
      continue;
    }

    if (categorias[categoria]) {
      categorias[categoria].push(url);
    }
  }

  const rutaSalida = path.join(__dirname, "raw_links.txt");
  const contenido = generarContenido(categorias, sha);

  fs.writeFileSync(rutaSalida, contenido, "utf-8");

  console.log(`[SUCCESS] Archivo generado: ${rutaSalida}`);
  console.log("");
  console.log("=".repeat(60));
  console.log("RESUMEN:");
  console.log(`  Electron:  ${categorias.electron.length}`);
  console.log(`  Backend:   ${categorias.backend.length}`);
  console.log(`  Frontend:  ${categorias.frontend.length}`);
  console.log(`  Docs:      ${categorias.docs.length}`);
  console.log(`  Utils:     ${categorias.utils.length}`);
  console.log(`  Config:    ${categorias.config.length}`);
  console.log(`  Otros:     ${categorias.otros.length}`);
  console.log(`  Ignorados: ${ignorados}`);
  console.log(`  TOTAL:     ${archivos.length - ignorados}`);
  console.log("=".repeat(60));
}

// ===============================
// EJECUCION
// ===============================

(async () => {
  const start = Date.now();
  console.log("=".repeat(60));
  console.log("GENERADOR DE ENLACES RAW DE GITHUB");
  console.log("=".repeat(60));

  try {
    await generarRawLinks();
  } catch (err) {
    console.error("[ERROR]", err.message);
    if (err.response) {
      console.error("[ERROR] Status:", err.response.status);
      console.error("[ERROR] Data:", err.response.data);
    }
    process.exit(1);
  }

  const end = Date.now();
  console.log(`[INFO] Tiempo total: ${((end - start) / 1000).toFixed(2)}s`);
  console.log("=".repeat(60));
})();
