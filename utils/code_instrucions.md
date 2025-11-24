# Instrucciones para Claude Code CLI - Sistema de Calificaciones

## 🎯 OBJETIVO PRINCIPAL
Corregir inconsistencias críticas, mejorar UI/UX, y refactorizar el sistema de calificaciones con mejoras de seguridad y usabilidad.

---

## 📋 TAREAS PRIORITARIAS

### 1. UNIFICAR SISTEMA DE CALIFICACIONES (CRÍTICO)
**Sistema definitivo: 0-100 puntos | Aprobación: ≥70 puntos**

#### Archivos a modificar:

**`database.js`:**
- ✅ Mantener CHECK constraint: `calificacion >= 0 AND calificacion <= 100`
- ✅ Mantener DECIMAL(5,2) para calificaciones
- ❌ ELIMINAR todas las referencias a `>= 6` (sistema 0-10)
- ✅ Cambiar TODAS las condiciones a `>= 70` para aprobado
- Líneas específicas:
  - L194: Trigger validation message → "entre 0 y 100"
  - L421: `CASE WHEN g.calificacion >= 6` → cambiar a `>= 70`
  - L573: `CASE WHEN g.calificacion >= 6` → cambiar a `>= 70`

**`renderer.js`:**
- ❌ L750: Eliminar validación 0-10 del prompt
- ✅ Cambiar a: `if (isNaN(grade) || grade < 0 || grade > 100)`
- ✅ Mensaje: "Calificación inválida. Debe estar entre 0 y 100"
- ✅ Mantener condiciones actuales (están correctas):
  - `>= 80` → badge verde
  - `>= 70` → badge amarillo  
  - `< 70` → badge rojo

**`index.html`:**
- ✅ L365: Confirmar input `min="0" max="100"` (ya está correcto)
- ✅ L367: Confirmar texto "Aprobatoria: 70 puntos" (ya está correcto)

---

### 2. VARIABLES DE ENTORNO PARA CREDENCIALES

**Crear nuevo archivo `.env.example`:**
```env
# Configuración MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=sistema_calificaciones
DB_PORT=3306
DB_TIMEZONE=-06:00
```

**Modificar `config.js`:**
```javascript
require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_calificaciones',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: process.env.DB_TIMEZONE || '-06:00'
};
```

**Actualizar `package.json`:**
```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",  // ← AGREGAR
    "electron": "^28.1.0",
    "mysql2": "^3.6.5"
  },
  "devDependencies": {
    // ❌ ELIMINAR electron de aquí (duplicado)
  }
}
```

**Actualizar `.gitignore`:**
```
node_modules/
.env
package-lock.json
*.log
```

---

### 3. MEJORAR SEGURIDAD DE ELECTRON

**Modificar `main.js` (líneas 12-16):**
```javascript
webPreferences: {
    preload: path.join(__dirname, 'preload.js'), // ← CREAR preload.js
    nodeIntegration: false,      // ✅ Seguro
    contextIsolation: true,      // ✅ Seguro
    enableRemoteModule: false,   // ✅ Deprecado, remover
    sandbox: true                // ✅ Agregar sandbox
}
```

**Crear nuevo archivo `preload.js`:**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Estudiantes
  getAllStudents: () => ipcRenderer.invoke('get-all-students'),
  createStudent: (nombre, apellido, matricula, email) => 
    ipcRenderer.invoke('create-student', nombre, apellido, matricula, email),
  updateStudent: (id, nombre, apellido, email) => 
    ipcRenderer.invoke('update-student', id, nombre, apellido, email),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),
  
  // Materias
  getAllSubjects: () => ipcRenderer.invoke('get-all-subjects'),
  createSubject: (nombre, creditos) => 
    ipcRenderer.invoke('create-subject', nombre, creditos),
  deleteSubject: (id) => ipcRenderer.invoke('delete-subject', id),
  
  // Calificaciones
  getAllGrades: () => ipcRenderer.invoke('get-all-grades'),
  createGrade: (studentId, subjectId, calificacion, periodo) => 
    ipcRenderer.invoke('create-grade', studentId, subjectId, calificacion, periodo),
  updateGrade: (id, calificacion) => 
    ipcRenderer.invoke('update-grade', id, calificacion),
  deleteGrade: (id) => ipcRenderer.invoke('delete-grade', id),
  
  // Reportes
  getStudentReport: () => ipcRenderer.invoke('get-student-report'),
  getSubjectStatistics: () => ipcRenderer.invoke('get-subject-statistics'),
  getAuditLog: (limit) => ipcRenderer.invoke('get-audit-log', limit),
  
  // Transacciones
  enrollStudentTransaction: (studentId, subjectIds, grades) => 
    ipcRenderer.invoke('enroll-student-transaction', studentId, subjectIds, grades),
  deleteStudentTransaction: (studentId) => 
    ipcRenderer.invoke('delete-student-transaction', studentId),
  
  // Status
  checkDbConnection: () => ipcRenderer.invoke('check-db-connection'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});
```

**Actualizar `renderer.js`:**
- Reemplazar TODAS las llamadas `ipcRenderer.invoke()` por `window.electronAPI.xxx()`
- Reemplazar TODAS las llamadas `ipcRenderer.send()` por `window.electronAPI.xxxWindow()`
- Ejemplo: `await ipcRenderer.invoke('get-all-students')` → `await window.electronAPI.getAllStudents()`

---

### 4. MEJORAR NOMBRES DE CAMPOS Y FUNCIONES

**`database.js` - Mejorar nomenclatura:**
```javascript
// Cambiar:
student_name → student_full_name
subject_name → subject_name (mantener)

// En query L432, cambiar a:
CONCAT(s.nombre, ' ', s.apellido) as student_full_name,

// Actualizar en renderer.js todas las referencias
grade.student_name → grade.student_full_name
```

---

### 5. MEJORAR LOG DE AUDITORÍA

**`database.js` - Mejorar triggers de auditoría:**

**Trigger INSERT (L213):**
```javascript
await connection.query(`
    CREATE TRIGGER trg_update_student_avg_after_insert
    AFTER INSERT ON grades
    FOR EACH ROW
    BEGIN
        UPDATE students
        SET promedio_general = (
            SELECT AVG(calificacion)
            FROM grades
            WHERE student_id = NEW.student_id
        )
        WHERE id = NEW.student_id;

        -- MEJORAR: Incluir nombres reales
        INSERT INTO grade_audit_log (action, table_name, record_id, new_value)
        VALUES ('INSERT', 'grades', NEW.id,
                CONCAT(
                    'Estudiante: ', (SELECT CONCAT(nombre, ' ', apellido) FROM students WHERE id = NEW.student_id),
                    ' | Materia: ', (SELECT nombre FROM subjects WHERE id = NEW.subject_id),
                    ' | Calificación: ', NEW.calificacion
                ));
    END
`);
```

**Trigger UPDATE (L236):**
```javascript
await connection.query(`
    CREATE TRIGGER trg_update_student_avg_after_update
    AFTER UPDATE ON grades
    FOR EACH ROW
    BEGIN
        UPDATE students
        SET promedio_general = (
            SELECT AVG(calificacion)
            FROM grades
            WHERE student_id = NEW.student_id
        )
        WHERE id = NEW.student_id;

        INSERT INTO grade_audit_log (action, table_name, record_id, old_value, new_value)
        VALUES ('UPDATE', 'grades', NEW.id,
                CONCAT(
                    'Estudiante: ', (SELECT CONCAT(nombre, ' ', apellido) FROM students WHERE id = NEW.student_id),
                    ' | Calificación anterior: ', OLD.calificacion
                ),
                CONCAT(
                    'Estudiante: ', (SELECT CONCAT(nombre, ' ', apellido) FROM students WHERE id = NEW.student_id),
                    ' | Nueva calificación: ', NEW.calificacion
                ));
    END
`);
```

**Trigger DELETE (L276):**
```javascript
await connection.query(`
    CREATE TRIGGER trg_audit_delete_grade
    AFTER DELETE ON grades
    FOR EACH ROW
    BEGIN
        INSERT INTO grade_audit_log (action, table_name, record_id, old_value)
        VALUES ('DELETE', 'grades', OLD.id,
                CONCAT(
                    'Estudiante: ', (SELECT CONCAT(nombre, ' ', apellido) FROM students WHERE id = OLD.student_id),
                    ' | Materia: ', (SELECT nombre FROM subjects WHERE id = OLD.subject_id),
                    ' | Calificación eliminada: ', OLD.calificacion
                ));

        UPDATE students
        SET promedio_general = COALESCE((
            SELECT AVG(calificacion)
            FROM grades
            WHERE student_id = OLD.student_id
        ), 0.00)
        WHERE id = OLD.student_id;
    END
`);
```

---

### 6. VERIFICAR ESTUDIANTES NUEVOS EN SELECT DE CALIFICACIONES

**`renderer.js` - Función `updateGradeSelects()` (L666):**

Verificar que se actualiza correctamente cuando:
1. Se crea un nuevo estudiante
2. Se cambia a la sección de calificaciones

Asegurar que `loadStudents()` se llama ANTES de cambiar a sección grades.

**Agregar en `renderer.js` después de crear estudiante (L324):**
```javascript
await loadStudents();
await updateGradeSelects(); // ← AGREGAR esta línea
await loadReports();
```

---

### 7. MEJORAR CONSOLA MYSQL

**`renderer.js` - Función `checkDatabaseConnection()` (L62):**

**Cambiar de:**
```javascript
statusBadge.innerHTML = `
    <span class="badge status-connecting">
        <span class="spinner-border spinner-border-sm me-2"></span>
        Conectando a MySQL...
    </span>
`;
```

**A:**
```javascript
// No mostrar "Conectando..." si ya está conectado
// El status inicial ya está en el HTML, no modificar hasta tener respuesta
```

**En `index.html` (L41), cambiar el estado inicial a:**
```html
<div id="database-status">
    <span class="badge status-connecting">
        <span class="spinner-border spinner-border-sm me-2"></span>
        Verificando conexión...
    </span>
</div>
```

**Al final de la consola, eliminar líneas duplicadas de "Conectando..."**

---

### 8. REDISEÑO UI - SIDEBAR LATERAL

**Crear nueva estructura en `index.html`:**

```html
<body>
    <div class="app-container">
        <!-- Titlebar (mantener igual) -->
        <div class="custom-titlebar">...</div>

        <!-- NUEVA ESTRUCTURA -->
        <div class="app-layout">
            <!-- SIDEBAR IZQUIERDO -->
            <aside class="app-sidebar">
                <!-- Logo/Header -->
                <div class="sidebar-header">
                    <img src="assets/logo.png" alt="Logo" class="sidebar-logo">
                    <h2 class="sidebar-title">Sistema de<br>Calificaciones</h2>
                </div>

                <!-- Estado MySQL -->
                <div class="sidebar-status" id="database-status">
                    <span class="badge status-connecting">
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Verificando...
                    </span>
                </div>

                <!-- Navegación -->
                <nav class="sidebar-nav">
                    <button class="sidebar-nav-item active" data-section="students">
                        <i class="bi bi-people-fill"></i>
                        <span>Estudiantes</span>
                        <span class="badge count-badge" id="students-count">0</span>
                    </button>
                    <button class="sidebar-nav-item" data-section="subjects">
                        <i class="bi bi-book-fill"></i>
                        <span>Materias</span>
                        <span class="badge count-badge" id="subjects-count">0</span>
                    </button>
                    <button class="sidebar-nav-item" data-section="grades">
                        <i class="bi bi-clipboard-check-fill"></i>
                        <span>Calificaciones</span>
                        <span class="badge count-badge" id="grades-count">0</span>
                    </button>
                    <button class="sidebar-nav-item" data-section="reports">
                        <i class="bi bi-graph-up"></i>
                        <span>Reportes</span>
                    </button>
                    <!-- ❌ ELIMINAR Demo SQL -->
                </nav>

                <!-- Footer Sidebar -->
                <div class="sidebar-footer">
                    <small class="text-muted">
                        <i class="bi bi-database-fill-gear"></i>
                        MySQL + Electron
                    </small>
                </div>
            </aside>

            <!-- MAIN CONTENT -->
            <main class="app-main">
                <!-- ❌ ELIMINAR header anterior -->
                <!-- ❌ ELIMINAR nav pills anterior -->
                
                <!-- Page Header (opcional, por sección) -->
                <div class="page-header">
                    <h1 class="page-title" id="page-title">Estudiantes</h1>
                    <p class="page-subtitle" id="page-subtitle">Gestión de estudiantes registrados</p>
                </div>

                <!-- Sections (mantener igual, solo agregar padding) -->
                <section id="section-students" class="content-section active">
                    ...
                </section>
                <!-- ... resto de secciones ... -->
            </main>
        </div>

        <!-- Consola (mantener igual pero ajustar posición) -->
        <aside class="console-panel">...</aside>
    </div>
</body>
```

---

### 9. NUEVOS ESTILOS CSS

**Agregar a `styles.css`:**

```css
/* ============================================
   NUEVO LAYOUT - SIDEBAR + MAIN
   ============================================ */

.app-layout {
    display: flex;
    height: calc(100vh - 40px); /* Restar titlebar */
    overflow: hidden;
}

/* SIDEBAR */
.app-sidebar {
    width: 280px;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    color: white;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 100;
}

.sidebar-header {
    padding: 2rem 1.5rem 1.5rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 1rem;
    border: 3px solid rgba(255, 255, 255, 0.2);
    object-fit: cover;
}

.sidebar-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.sidebar-status {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
}

.sidebar-status .badge {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
}

/* Navegación Sidebar */
.sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
}

.sidebar-nav-item {
    width: 100%;
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
    text-align: left;
}

.sidebar-nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

.sidebar-nav-item.active {
    background: rgba(96, 165, 250, 0.1);
    color: white;
    border-left-color: #60a5fa;
}

.sidebar-nav-item i {
    font-size: 1.5rem;
    min-width: 24px;
}

.sidebar-nav-item > span:not(.badge) {
    flex: 1;
}

.sidebar-nav-item .count-badge {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    min-width: 32px;
    text-align: center;
}

.sidebar-nav-item.active .count-badge {
    background: #60a5fa;
}

.sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
}

/* MAIN CONTENT */
.app-main {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg-light);
}

.page-header {
    padding: 2rem 2rem 1rem;
    background: white;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 2rem;
}

.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem;
}

.page-subtitle {
    font-size: 1rem;
    color: var(--color-text-secondary);
    margin: 0;
}

.content-section {
    padding: 0 2rem 2rem;
}

/* ============================================
   AJUSTES RESPONSIVOS
   ============================================ */

@media (max-width: 768px) {
    .app-sidebar {
        width: 70px;
    }
    
    .sidebar-title,
    .sidebar-nav-item > span:not(.badge),
    .sidebar-footer small {
        display: none;
    }
    
    .sidebar-logo {
        width: 50px;
        height: 50px;
    }
    
    .sidebar-nav-item {
        justify-content: center;
        padding: 1rem 0.5rem;
    }
}

/* ============================================
   ELIMINAR ESTILOS ANTIGUOS
   ============================================ */

/* ❌ Eliminar:
   - .modern-header
   - .modern-nav
   - .nav-pills.nav-modern
   - Todo el CSS relacionado con el header/nav superior
*/
```

---

### 10. AGREGAR LOGO PERSONALIZADO

**Crear carpeta `assets/` en la raíz del proyecto**

**Agregar placeholder o imagen real:**
```
calificaciones-app/
├── assets/
│   ├── logo.png          (80x80px mínimo, preferible 256x256px)
│   └── icon.png          (para ventana Electron, 256x256px)
```

**Si no hay logo, crear uno temporal con iniciales "SC" (Sistema de Calificaciones)**

**En `index.html`, usar:**
```html
<img src="assets/logo.png" alt="Logo" class="sidebar-logo" 
     onerror="this.style.display='none'">
```

---

### 11. ACTUALIZAR renderer.js PARA NUEVA UI

**Función `switchSection()` - Actualizar títulos:**
```javascript
function switchSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Mostrar sección seleccionada
    document.getElementById(`section-${section}`).classList.add('active');
    currentSection = section;

    // Actualizar título de página
    const titles = {
        students: { title: 'Estudiantes', subtitle: 'Gestión de estudiantes registrados' },
        subjects: { title: 'Materias', subtitle: 'Administración de materias y créditos' },
        grades: { title: 'Calificaciones', subtitle: 'Registro y gestión de calificaciones' },
        reports: { title: 'Reportes', subtitle: 'Estadísticas y análisis de rendimiento' }
    };

    const pageInfo = titles[section] || { title: '', subtitle: '' };
    document.getElementById('page-title').textContent = pageInfo.title;
    document.getElementById('page-subtitle').textContent = pageInfo.subtitle;

    logToConsole(`Cambio a sección: ${section}`, 'info');
}
```

**Actualizar `setupNavigation()`:**
```javascript
function setupNavigation() {
    const navButtons = document.querySelectorAll('.sidebar-nav-item[data-section]');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            switchSection(section);

            // Actualizar navegación activa
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}
```

---

### 12. ELIMINAR SECCIÓN DEMO SQL

**`index.html`:**
- ❌ Eliminar botón de navegación "Demo SQL"
- ❌ Eliminar `<section id="section-demo">` completo

**`renderer.js`:**
- ❌ Eliminar `setupDemos()`
- ❌ Eliminar `updateDemoSelects()`
- ❌ Eliminar `handleDemoTransaction()`
- ❌ Eliminar `handleDemoDelete()`
- ❌ Eliminar llamada a `setupDemos()` en `DOMContentLoaded`

**IMPORTANTE:** Mantener las funcionalidades de transacciones en el backend, solo remover la UI de demostración.

---

### 13. AJUSTAR CONSOLA MYSQL

**`styles.css` - Ajustar posición:**
```css
.console-panel {
    position: fixed;
    bottom: 0;
    left: 280px; /* Ancho del sidebar */
    right: 0;
    height: 200px;
    background: #1e293b;
    border-top: 2px solid #475569;
    z-index: 50;
    transition: all 0.3s ease;
}

.console-panel.minimized {
    height: 40px;
}

@media (max-width: 768px) {
    .console-panel {
        left: 70px;
    }
}
```

---

### 14. MEJORAS ADICIONALES UX

**Agregar tooltips a botones:**
```html
<button class="btn btn-sm btn-primary" 
        onclick="editStudent(${student.id})"
        title="Editar estudiante">
    <i class="bi bi-pencil"></i>
</button>
```

**Agregar confirmación visual al guardar:**
```javascript
// En renderer.js, después de operaciones exitosas
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
    toast.innerHTML = `
        <i class="bi bi-check-circle-fill"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

**CSS para toasts:**
```css
.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 9999;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease;
}

.toast-notification.show {
    opacity: 1;
    transform: translateX(0);
}

.toast-notification.success {
    border-left: 4px solid #10b981;
}

.toast-notification i {
    font-size: 1.5rem;
    color: #10b981;
}
```

---

## 📝 CHECKLIST DE VALIDACIÓN

Después de implementar todos los cambios, verificar:

- [ ] ✅ Sistema de calificaciones 0-100 con aprobación ≥70 en TODO el código
- [ ] ✅ Variables de entorno funcionando (.env creado, config.js actualizado)
- [ ] ✅ Electron con contextIsolation: true (preload.js creado y funcionando)
- [ ] ✅ Dependencia duplicada eliminada de package.json
- [ ] ✅ Log de auditoría muestra nombres reales de estudiantes y materias
- [ ] ✅ Estudiantes nuevos aparecen inmediatamente en select de calificaciones
- [ ] ✅ Estado de conexión MySQL sin "Conectando..." al final
- [ ] ✅ Sidebar lateral funcionando con logo personalizado
- [ ] ✅ Demo SQL eliminado completamente
- [ ] ✅ Page headers dinámicos funcionando
- [ ] ✅ Consola MySQL ajustada a nueva posición
- [ ] ✅ Todos los `ipcRenderer` cambiados a `window.electronAPI`
- [ ] ✅ Tooltips agregados a botones de acción
- [ ] ✅ Toast notifications implementados
- [ ] ✅ Responsive design funcionando (sidebar colapsado en móvil)
- [ ] ✅ Sin errores en consola del navegador
- [ ] ✅ Todas las funcionalidades CRUD funcionando correctamente

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Crear `.env` y actualizar `config.js`** (5 min)
2. **Actualizar `package.json`** - eliminar duplicado, agregar dotenv (2 min)
3. **Corregir sistema de calificaciones en `database.js`** (10 min)
4. **Mejorar triggers de auditoría en `database.js`** (15 min)
5. **Corregir validación en `renderer.js`** (5 min)
6. **Crear `preload.js`** (20 min)
7. **Actualizar `main.js`** - webPreferences (5 min)
8. **Actualizar `renderer.js`** - cambiar a `window.electronAPI` (30 min)
9. **Rediseñar `index.html`** - nueva estructura sidebar (30 min)
10. **Actualizar `styles.css`** - nuevo layout y componentes (30 min)
11. **Crear carpeta `assets/` y agregar logo** (5 min)
12. **Eliminar sección Demo SQL** (10 min)
13. **Agregar toasts y tooltips** (15 min)
14. **Testing completo** (20 min)

**Tiempo estimado total: ~3 horas**

---

## ⚠️ NOTAS IMPORTANTES

1. **Backup antes de empezar:** Hacer commit de todo antes de los cambios
2. **Probar después de cada cambio mayor:** No hacer todo de una vez
3. **Mantener funcionalidad:** No romper CRUD existente
4. **El logo puede ser placeholder:** No es crítico tener uno personalizado de inmediato
5. **Variables de entorno:** Crear `.env` local, NO versionar en Git

---

## 📚 DOCUMENTACIÓN A ACTUALIZAR

Después de implementar cambios, actualizar:
- `docs/PROJECT_STRUCTURE.md`
- `docs/README.md`
- `README.md` principal
- Agregar `CHANGELOG.md` con lista de cambios

---

**¿Alguna duda sobre algún punto específico antes de comenzar?**