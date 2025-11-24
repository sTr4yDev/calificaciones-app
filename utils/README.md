# 🔗 Utilidades del Proyecto

Este directorio contiene scripts útiles para el mantenimiento y desarrollo del proyecto.

---

## 📄 Scripts Disponibles

### `links.js` - Generador de Enlaces RAW de GitHub

**Propósito:** Genera una lista completa de enlaces directos (raw) a todos los archivos del repositorio en GitHub, organizados por categoría.

#### Uso

```bash
# Desde la raíz del proyecto
npm run generate-links

# O directamente
node utils/links.js
```

#### Configuración

Edita las constantes en `links.js`:

```javascript
const USER = "sTr4yDev";              // Tu usuario de GitHub
const REPO = "calificaciones-app";     // Nombre del repositorio
const BRANCH = "main";                 // Rama a procesar
const TOKEN = "";                      // Token de GitHub (opcional)
```

#### Salida

Genera el archivo `utils/raw_links.txt` con enlaces organizados en:
- **BACKEND** - Archivos de configuración y API
- **FRONTEND** - HTML, CSS, JS, assets
- **DOCS** - Documentación (MD, PDF, TXT)
- **OTROS** - Resto de archivos

#### Ejemplo de salida

```
# RAW LINKS — Actualizado 2025-11-20T19:09:15.104Z
# Repositorio: sTr4yDev/calificaciones-app
# Commit: 321235f8

========================= BACKEND LINKS =========================
https://raw.githubusercontent.com/sTr4yDev/calificaciones-app/main/config.js

========================= FRONTEND LINKS =========================
https://raw.githubusercontent.com/sTr4yDev/calificaciones-app/main/index.html
https://raw.githubusercontent.com/sTr4yDev/calificaciones-app/main/styles.css
...
```

#### Casos de uso

1. **Compartir código con IAs:** Pasa los enlaces directos a Claude, ChatGPT, etc.
2. **Revisión de código:** Enlaces directos para code review
3. **Documentación:** Referencias a versiones específicas de archivos
4. **CI/CD:** Descargar archivos específicos en pipelines

---

## 🔧 Dependencias

```json
{
  "axios": "^1.6.2"  // Para peticiones HTTP a la API de GitHub
}
```

---

## 🚀 Agregando Nuevas Utilidades

Para agregar un nuevo script:

1. **Crear el archivo** en `utils/`
2. **Documentar aquí** en este README
3. **Agregar script npm** (opcional) en `package.json`

Ejemplo:

```javascript
// utils/mi-script.js
const fs = require('fs');

console.log('[UTIL] Mi script ejecutándose...');
// ... tu código

// Exportar si se necesita en otros archivos
module.exports = { miFuncion };
```

```json
// package.json
{
  "scripts": {
    "mi-script": "node utils/mi-script.js"
  }
}
```

---

## 📋 Ideas de Utilidades Futuras

### Sugerencias de scripts útiles:

1. **backup-db.js** - Respaldo automático de MySQL
```bash
npm run backup-db
```

2. **seed-data.js** - Generar datos de prueba masivos
```bash
npm run seed -- --count 100
```

3. **clean-logs.js** - Limpiar logs antiguos
```bash
npm run clean-logs -- --days 30
```

4. **validate-db.js** - Validar integridad de BD
```bash
npm run validate-db
```

5. **export-schema.js** - Exportar schema SQL
```bash
npm run export-schema
```

6. **stats.js** - Estadísticas del proyecto
```bash
npm run stats
```

---

## 🎯 Convenciones

### Mensajes de Log
```javascript
console.log('[UTIL] Mensaje informativo');
console.log('[SUCCESS] Operación exitosa');
console.log('[ERROR] Error detectado');
console.log('[WARNING] Advertencia');
```

### Manejo de Errores
```javascript
try {
    // código
} catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);  // Salir con código de error
}
```

### Argumentos de Línea de Comandos
```javascript
const args = process.argv.slice(2);
const flags = {};

args.forEach(arg => {
    if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        flags[key] = value || true;
    }
});

// Uso: node script.js --user=admin --verbose
console.log(flags.user);      // 'admin'
console.log(flags.verbose);   // true
```

---

## 📚 Recursos

- [Node.js File System](https://nodejs.org/api/fs.html)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

**Última actualización:** 2025-01-20
