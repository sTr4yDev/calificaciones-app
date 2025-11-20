# Guía para Asistentes de IA - Sistema de Calificaciones

## 📋 Información General del Proyecto

**Nombre:** Sistema de Gestión de Calificaciones
**Tecnologías:** Electron + MySQL + Node.js
**Propósito:** Aplicación de escritorio para gestionar estudiantes, materias, calificaciones con triggers, transacciones y auditoría

---

## 🎯 Principios de Desarrollo

### 1. Convenciones de Código

#### Mensajes de Consola
- **SIEMPRE** usar etiquetas en lugar de emojis para evitar problemas de codificación
- Formato estándar: `[CATEGORÍA] Mensaje descriptivo`

```javascript
// ✅ CORRECTO
console.log('[SUCCESS] Estudiante creado exitosamente');
console.log('[ERROR] Error conectando a la base de datos');
console.log('[INFO] Base de datos lista (sin datos de ejemplo)');
console.log('[TRANSACTION] START - Iniciando transacción');

// ❌ INCORRECTO (emojis causan problemas de encoding)
console.log('✅ Estudiante creado exitosamente');
console.log('❌ Error conectando a la base de datos');
```

**Categorías de mensajes:**
- `[APP]` - Eventos de la aplicación Electron
- `[INIT]` - Procesos de inicialización
- `[SUCCESS]` - Operaciones exitosas
- `[ERROR]` - Errores y excepciones
- `[INFO]` - Información general
- `[TRANSACTION]` - Operaciones de transacciones SQL
- `[WARNING]` - Advertencias

#### Separadores Visuales
```javascript
console.log('='.repeat(60)); // Para separar secciones importantes
```

### 2. Codificación y Caracteres

#### Archivos JavaScript
- **NO usar tildes ni caracteres especiales en código fuente**
- Escribir sin acentos: `aplicacion`, `conexion`, `transaccion`
- Usar comentarios en inglés cuando sea posible

```javascript
// ✅ CORRECTO
// Inicializar aplicacion
console.log('[APP] Aplicacion Electron iniciada');

// ❌ INCORRECTO
// Inicializar aplicación
console.log('[APP] Aplicación Electron iniciada');
```

#### Archivos HTML
- Usar `charset="UTF-8"` en el meta tag
- Tildes y caracteres especiales están permitidos en HTML

### 3. Estructura de Datos

#### Base de Datos Vacía
- La aplicación **DEBE iniciar sin datos de ejemplo**
- Los datos de prueba están comentados en `database.js:301-343`
- Para habilitar datos de ejemplo: descomentar el bloque

#### Triggers y Transacciones
- **NUNCA** eliminar o modificar triggers sin entender su función
- Triggers existentes:
  - `trg_validate_grade_before_insert` - Valida calificaciones (0-10)
  - `trg_update_student_avg_after_insert` - Actualiza promedio al insertar
  - `trg_update_student_avg_after_update` - Actualiza promedio al actualizar
  - `trg_update_subject_stats_after_insert` - Actualiza estadísticas de materias
  - `trg_audit_delete_grade` - Registra eliminaciones en auditoría

### 4. Interfaz de Usuario

#### Ventana de Electron
- Usa `frame: false` para controles personalizados
- Barra de título personalizada con botones de ventana
- No modificar los controles de ventana sin preservar funcionalidad

#### Tipografía
- **Inter** - Fuente principal (UI, textos)
- **JetBrains Mono** - Fuente monoespaciada (código, consola)
- Importadas desde Google Fonts en `styles.css`

#### Tema Visual
- Colores primarios: Violeta/Púrpura moderno (#6366f1, #8b5cf6)
- Gradientes en headers y botones
- Sistema de colores en variables CSS (`:root`)

---

## 🚀 Guías de Implementación

### Al Agregar Nuevas Funcionalidades

1. **Leer primero, modificar después**
   - Siempre leer el archivo completo antes de editarlo
   - Entender el contexto y dependencias

2. **Mantener consistencia**
   - Seguir el patrón de nombres existente
   - Usar las mismas convenciones de código
   - Mantener el formato de mensajes de log

3. **Documentar cambios**
   - Agregar comentarios descriptivos
   - Actualizar esta documentación si es necesario

### Al Corregir Errores

1. **Identificar la causa raíz**
   - No aplicar parches superficiales
   - Entender por qué ocurre el error

2. **Preservar funcionalidad existente**
   - No romper código que funciona
   - Probar cambios antes de confirmar

3. **Registrar en consola**
   - Usar `[ERROR]` para errores
   - Incluir contexto útil para debugging

### Al Modificar la Base de Datos

1. **Respetar las relaciones**
   - `students` ← `grades` → `subjects`
   - Foreign keys con `ON DELETE CASCADE`

2. **Probar transacciones**
   - Verificar COMMIT y ROLLBACK
   - Comprobar que los triggers funcionan

3. **Mantener auditoría**
   - No eliminar logs de `grade_audit_log`
   - Registrar cambios importantes

---

## 🔧 Tareas Comunes

### Habilitar Datos de Ejemplo

**Archivo:** `database.js:301-343`

```javascript
async insertSampleData() {
    // Datos de ejemplo deshabilitados - La aplicación inicia vacía
    console.log('[INFO] Base de datos lista (sin datos de ejemplo)');
    return;

    /* DESCOMENTADO PARA INSERTAR DATOS DE EJEMPLO:
    const connection = await this.pool.getConnection();
    // ... resto del código
    */
}
```

**Pasos:**
1. Comentar el `return;` de la línea 304
2. Descomentar el bloque desde línea 306 hasta 343
3. Reiniciar la aplicación

### Agregar Nueva Funcionalidad CRUD

**Patrón a seguir:**

1. **Database (database.js)**
```javascript
async createNuevaEntidad(campo1, campo2) {
    const connection = await this.pool.getConnection();
    try {
        const [result] = await connection.query(
            'INSERT INTO tabla (campo1, campo2) VALUES (?, ?)',
            [campo1, campo2]
        );
        console.log(`[SUCCESS] Entidad creada: ID ${result.insertId}`);
        return result.insertId;
    } finally {
        connection.release();
    }
}
```

2. **Main Process (main.js)**
```javascript
ipcMain.handle('create-nueva-entidad', async (event, campo1, campo2) => {
    try {
        return await db.createNuevaEntidad(campo1, campo2);
    } catch (error) {
        console.error('[ERROR] Error creando entidad:', error);
        throw error;
    }
});
```

3. **Renderer Process (renderer.js)**
```javascript
async function handleSubmit(e) {
    e.preventDefault();
    try {
        await ipcRenderer.invoke('create-nueva-entidad', campo1, campo2);
        logToConsole('Entidad creada exitosamente', 'success');
        await loadAllData();
    } catch (error) {
        logToConsole(`Error: ${error.message}`, 'error');
    }
}
```

### Modificar Estilos CSS

**Usar variables CSS existentes:**

```css
/* Variables disponibles en :root */
--primary-color: #6366f1;
--success-color: #10b981;
--danger-color: #ef4444;
--warning-color: #f59e0b;
--info-color: #06b6d4;

/* Usar en estilos */
.mi-elemento {
    background: var(--primary-color);
    color: white;
}
```

---

## ⚠️ Errores Comunes a Evitar

### 1. Codificación de Caracteres
```javascript
// ❌ Causa problemas de encoding
console.log('🔌 Conectando...');
const mensaje = 'Aplicación iniciada';

// ✅ Funciona correctamente
console.log('[INIT] Conectando...');
const mensaje = 'Aplicacion iniciada';
```

### 2. Rutas Relativas
```javascript
// ❌ Puede fallar
const file = './data/archivo.json';

// ✅ Usar rutas absolutas
const file = path.join(__dirname, 'data', 'archivo.json');
```

### 3. Promesas sin Await
```javascript
// ❌ No espera resultado
function loadData() {
    ipcRenderer.invoke('get-students'); // Sin await
    updateUI(); // Ejecuta antes de obtener datos
}

// ✅ Espera correctamente
async function loadData() {
    const students = await ipcRenderer.invoke('get-students');
    updateUI(students);
}
```

### 4. Modificar Triggers sin Entender
```javascript
// ❌ Eliminar triggers rompe funcionalidad
await connection.query('DROP TRIGGER trg_update_student_avg_after_insert');
// Los promedios ya no se actualizarán automáticamente

// ✅ Entender y preservar lógica
// Si necesitas modificar, primero lee y entiende el trigger
```

---

## 📝 Checklist para Pull Requests / Cambios

Antes de considerar un cambio completo, verificar:

- [ ] Los mensajes de consola usan formato `[CATEGORÍA]`
- [ ] No hay emojis en código JavaScript
- [ ] No hay tildes en variables, funciones o comentarios de código
- [ ] Se mantiene la consistencia con el código existente
- [ ] Los cambios no rompen funcionalidad existente
- [ ] Se probó en Windows (plataforma objetivo)
- [ ] La base de datos inicia vacía (sin datos de ejemplo)
- [ ] Los triggers siguen funcionando correctamente
- [ ] Las transacciones tienen ROLLBACK apropiado
- [ ] La UI se ve bien y los controles funcionan
- [ ] No hay errores en la consola del navegador
- [ ] Los estilos CSS usan las variables existentes

---

## 🆘 Recursos de Ayuda

### Estructura de Archivos Clave
- `main.js` - Proceso principal de Electron (backend)
- `renderer.js` - Proceso de renderizado (frontend)
- `database.js` - Lógica de base de datos y MySQL
- `index.html` - Interfaz de usuario
- `styles.css` - Estilos y tema visual
- `config.js` - Configuración de conexión MySQL

### Comandos Útiles
```bash
# Instalar dependencias
npm install

# Ejecutar aplicación
npm start

# Limpiar base de datos (desde MySQL)
DROP DATABASE IF EXISTS calificaciones_db;
```

### Debugging
- DevTools: Descomentar línea 33 en `main.js`
- Logs: Revisar consola de terminal (backend) y DevTools (frontend)
- MySQL: Verificar conexión en `config.js`

---

## 📌 Notas Finales

- **Prioridad:** Funcionalidad > Estética
- **Principio:** Si funciona, no lo toques (a menos que sea necesario)
- **Documentación:** Siempre actualizar estos docs al hacer cambios mayores
- **Testing:** Probar cada cambio antes de confirmar
- **Comunicación:** Documentar decisiones importantes en comentarios

**Última actualización:** 2025-01-20
**Mantenedor actual:** IA Assistant
