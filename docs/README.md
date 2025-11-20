# 📚 Documentación del Sistema de Calificaciones

Bienvenido a la documentación completa del Sistema de Gestión de Calificaciones. Este directorio contiene toda la información necesaria para entender, mantener y mejorar el proyecto.

---

## 📖 Índice de Documentación

### 🤖 [AI_GUIDELINES.md](./AI_GUIDELINES.md)
**Guía para Asistentes de IA**

Documento esencial para cualquier IA que trabaje en este proyecto. Contiene:
- ✅ Convenciones de código y mensajes de consola
- ✅ Mejores prácticas de codificación
- ✅ Guías para agregar nuevas funcionalidades
- ✅ Errores comunes a evitar
- ✅ Checklist para pull requests

**Cuándo leer:**
- Antes de hacer cualquier modificación al código
- Al agregar nuevas funcionalidades
- Al corregir errores

---

### 🏗️ [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
**Estructura Completa del Proyecto**

Documentación técnica detallada que incluye:
- 📁 Árbol de directorios
- 📄 Descripción de cada archivo
- 🗄️ Esquema de base de datos (tablas, triggers, vistas)
- 🔄 Flujos de datos
- 📊 Diagramas de arquitectura
- 🔐 Consideraciones de seguridad

**Cuándo leer:**
- Para entender la arquitectura general
- Al buscar dónde está implementada una funcionalidad
- Al planear cambios estructurales
- Para onboarding de nuevos desarrolladores

---

### 🚀 [IMPROVEMENT_AREAS.md](./IMPROVEMENT_AREAS.md)
**Áreas de Mejora y Roadmap**

Plan detallado de mejoras futuras organizadas por prioridad:
- 🔴 **Críticas:** Seguridad de Electron, gestión de contraseñas, validaciones
- 🟠 **Altas:** Testing, logging, migraciones de BD
- 🟡 **Medias:** Búsqueda, paginación, exportación, gráficos
- 🟢 **Bajas:** i18n, atajos de teclado, drag & drop

Incluye:
- Ejemplos de código para cada mejora
- Librerías recomendadas
- Roadmap por sprints
- Optimizaciones de performance

**Cuándo leer:**
- Al planear nuevas funcionalidades
- Para priorizar el backlog
- Al buscar ideas de mejora
- Para roadmap de desarrollo

---

## 🎯 ¿Por Dónde Empezar?

### 👨‍💻 Si eres Desarrollador
1. Lee [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) primero
2. Revisa [AI_GUIDELINES.md](./AI_GUIDELINES.md) para convenciones
3. Consulta [IMPROVEMENT_AREAS.md](./IMPROVEMENT_AREAS.md) para tareas

### 🤖 Si eres una IA
1. **OBLIGATORIO:** Lee [AI_GUIDELINES.md](./AI_GUIDELINES.md) antes de cualquier cambio
2. Consulta [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) para contexto
3. Revisa [IMPROVEMENT_AREAS.md](./IMPROVEMENT_AREAS.md) para mejoras sugeridas

### 📊 Si eres Product Owner / PM
1. Revisa [IMPROVEMENT_AREAS.md](./IMPROVEMENT_AREAS.md) para el roadmap
2. Consulta [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) para entender capacidades
3. Lee [AI_GUIDELINES.md](./AI_GUIDELINES.md) para requisitos técnicos

---

## 🔑 Conceptos Clave del Proyecto

### Tecnologías Principales
```
Electron (Framework de escritorio)
  ├─ Node.js (Backend)
  ├─ HTML/CSS/JS (Frontend)
  └─ MySQL (Base de datos)
```

### Arquitectura
```
┌─────────────────────┐
│   Main Process      │ ← Backend (Node.js)
│    (main.js)        │
└──────────┬──────────┘
           │ IPC
┌──────────▼──────────┐
│  Renderer Process   │ ← Frontend (Browser)
│   (renderer.js)     │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   MySQL Database    │
│   (database.js)     │
└─────────────────────┘
```

### Funcionalidades Core
- ✅ CRUD completo (Estudiantes, Materias, Calificaciones)
- ✅ Triggers automáticos (5 triggers)
- ✅ Transacciones con ROLLBACK
- ✅ Sistema de auditoría
- ✅ Reportes y estadísticas
- ✅ Consola MySQL en tiempo real

---

## 📝 Guías Rápidas

### Agregar Nueva Funcionalidad

```javascript
// 1. Base de datos (database.js)
async createNuevaEntidad(datos) {
    const connection = await this.pool.getConnection();
    try {
        const [result] = await connection.query('INSERT INTO...', datos);
        console.log('[SUCCESS] Entidad creada');
        return result.insertId;
    } finally {
        connection.release();
    }
}

// 2. IPC Handler (main.js)
ipcMain.handle('create-nueva-entidad', async (event, datos) => {
    try {
        return await db.createNuevaEntidad(datos);
    } catch (error) {
        console.error('[ERROR] Error:', error);
        throw error;
    }
});

// 3. Frontend (renderer.js)
async function handleSubmit() {
    try {
        await ipcRenderer.invoke('create-nueva-entidad', datos);
        logToConsole('Creado exitosamente', 'success');
    } catch (error) {
        logToConsole(`Error: ${error.message}`, 'error');
    }
}
```

### Ejecutar Proyecto

```bash
# Instalar dependencias
npm install

# Configurar MySQL
# Editar config.js con tus credenciales

# Ejecutar aplicación
npm start
```

### Habilitar Datos de Ejemplo

```javascript
// database.js línea 304
async insertSampleData() {
    // Comentar esta línea:
    // return;

    // Descomentar el bloque de código debajo
}
```

---

## 🛠️ Herramientas y Scripts

### Comandos NPM
```bash
npm start              # Ejecutar aplicación
npm test               # Ejecutar tests (TO DO)
npm run build          # Construir para producción (TO DO)
```

### Comandos MySQL Útiles
```sql
-- Resetear base de datos
DROP DATABASE IF EXISTS calificaciones_db;

-- Ver estructura
SHOW TABLES;
DESCRIBE students;

-- Ver triggers
SHOW TRIGGERS;

-- Ver logs de auditoría
SELECT * FROM grade_audit_log ORDER BY timestamp DESC LIMIT 10;
```

---

## 📊 Métricas del Proyecto

### Estado Actual
```
Líneas de código:     ~2,500
Archivos principales: 6
Tablas BD:            4
Triggers:             5
Vistas:               1
Tests:                0 (pendiente)
Cobertura:            0% (pendiente)
```

### Cobertura Funcional
- ✅ CRUD Estudiantes: 100%
- ✅ CRUD Materias: 100%
- ✅ CRUD Calificaciones: 100%
- ✅ Reportes: 80%
- ⚠️ Exportación: 0%
- ⚠️ Búsqueda: 0%
- ⚠️ Validación: 40%

---

## 🚨 Avisos Importantes

### ⚠️ Seguridad
**ADVERTENCIA:** La configuración actual NO es segura para producción:
- `nodeIntegration: true` - Permite acceso completo a Node.js
- `contextIsolation: false` - Sin aislamiento de contexto
- Contraseñas en texto plano en `config.js`

**Acción requerida:** Ver [IMPROVEMENT_AREAS.md](./IMPROVEMENT_AREAS.md) - Sección "Mejoras Críticas"

### 📝 Convenciones Importantes
1. **NO usar emojis en código JavaScript** (causa problemas de encoding)
2. **NO usar tildes en código** (escribir: conexion, aplicacion)
3. **Formato de logs:** `[CATEGORÍA] Mensaje`
4. **Base de datos:** Inicia vacía (sin datos de ejemplo)

---

## 🤝 Contribuciones

### Antes de Contribuir
1. ✅ Lee [AI_GUIDELINES.md](./AI_GUIDELINES.md)
2. ✅ Entiende [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
3. ✅ Revisa [IMPROVEMENT_AREAS.md](./IMPROVEMENT_AREAS.md)
4. ✅ Completa el checklist de PR

### Pull Request Checklist
- [ ] Código sigue convenciones del proyecto
- [ ] Mensajes de log usan formato `[CATEGORÍA]`
- [ ] Sin emojis ni tildes en código
- [ ] Tests incluidos (cuando aplique)
- [ ] Documentación actualizada
- [ ] Sin breaking changes innecesarios

---

## 📞 Recursos Adicionales

### Enlaces Útiles
- [Documentación de Electron](https://www.electronjs.org/docs)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3)

### Contacto y Soporte
- **Issues:** Crear issue en el repositorio
- **Documentación:** Este directorio `/docs`
- **Logs:** Revisar consola de aplicación

---

## 🔄 Mantenimiento de Documentación

### Actualizar Documentación
La documentación debe actualizarse cuando:
- Se agregan nuevas funcionalidades mayores
- Se cambia la estructura del proyecto
- Se modifican convenciones de código
- Se completa un hito del roadmap

### Responsables
- **AI_GUIDELINES.md:** Actualizar al cambiar convenciones
- **PROJECT_STRUCTURE.md:** Actualizar al cambiar arquitectura
- **IMPROVEMENT_AREAS.md:** Actualizar cada 2 sprints
- **README.md:** Actualizar con cambios significativos

---

## 📅 Historial de Cambios

### v1.0.0 - 2025-01-20
- ✅ Documentación inicial creada
- ✅ Guidelines para IAs
- ✅ Estructura del proyecto documentada
- ✅ Roadmap de mejoras definido

---

## 📜 Licencia y Créditos

**Proyecto:** Sistema de Gestión de Calificaciones
**Versión:** 1.0.0
**Última actualización:** 2025-01-20
**Tecnologías:** Electron + MySQL + Node.js + Bootstrap

---

## 🎯 Siguientes Pasos

### Inmediatos
1. ✅ Leer toda la documentación
2. ⏳ Implementar mejoras críticas de seguridad
3. ⏳ Agregar sistema de testing
4. ⏳ Configurar CI/CD

### Mediano Plazo
1. ⏳ Implementar búsqueda y filtrado
2. ⏳ Agregar exportación de datos
3. ⏳ Crear gráficos y visualizaciones
4. ⏳ Modo oscuro

### Largo Plazo
1. ⏳ Internacionalización (i18n)
2. ⏳ Empaquetado para producción
3. ⏳ Sistema de auto-actualización
4. ⏳ Documentación de usuario final

---

**¿Preguntas? ¿Sugerencias?**
Abre un issue o contribuye directamente al proyecto!

**Happy Coding! 🚀**
