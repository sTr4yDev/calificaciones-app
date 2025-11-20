# Estructura del Proyecto - Sistema de Calificaciones

## 📁 Árbol de Directorios

```
calificaciones-app/
│
├── docs/                          # Documentación del proyecto
│   ├── AI_GUIDELINES.md          # Guías para asistentes IA
│   ├── PROJECT_STRUCTURE.md      # Este archivo
│   ├── IMPROVEMENT_AREAS.md      # Áreas de mejora
│   └── README.md                 # Índice de documentación
│
├── node_modules/                  # Dependencias de npm
│
├── utils/                         # Utilidades (si existen)
│   └── links.js                  # Enlaces y utilidades
│
├── config.js                      # ⚙️ Configuración de MySQL
├── database.js                    # 🗄️ Lógica de base de datos
├── main.js                        # 🖥️ Proceso principal Electron
├── renderer.js                    # 🎨 Proceso de renderizado (Frontend)
├── index.html                     # 📄 Interfaz de usuario
├── styles.css                     # 🎨 Estilos y tema visual
│
├── package.json                   # Configuración de npm
├── package-lock.json              # Lockfile de dependencias
│
└── README.md                      # Documentación principal
```

---

## 🗂️ Descripción de Archivos Principales

### 1. `config.js` - Configuración de Base de Datos

**Propósito:** Almacenar credenciales de MySQL

```javascript
module.exports = {
    host: 'localhost',
    user: 'root',
    password: '', // Tu contraseña MySQL
    database: 'calificaciones_db'
};
```

**Responsabilidades:**
- Configuración de conexión a MySQL
- Parámetros de host, usuario, contraseña
- Nombre de la base de datos

**Dependencias:** Ninguna
**Usado por:** `database.js`

---

### 2. `database.js` - Capa de Acceso a Datos

**Propósito:** Gestionar toda la lógica de MySQL

**Estructura:**
```javascript
class CalificacionesDB {
    constructor() { }

    // INICIALIZACIÓN
    async initializeDatabase() { }
    async createDatabase() { }
    async createTables() { }
    async createTriggers() { }
    async createViews() { }
    async insertSampleData() { }

    // CRUD ESTUDIANTES
    async createStudent() { }
    async getAllStudents() { }
    async updateStudent() { }
    async deleteStudent() { }

    // CRUD MATERIAS
    async createSubject() { }
    async getAllSubjects() { }
    async deleteSubject() { }

    // CRUD CALIFICACIONES
    async createGrade() { }
    async getAllGrades() { }
    async updateGrade() { }
    async deleteGrade() { }

    // TRANSACCIONES
    async enrollStudentWithTransaction() { }
    async deleteStudentWithGradesTransaction() { }

    // REPORTES
    async getStudentReport() { }
    async getSubjectStatistics() { }
    async getAuditLog() { }
}
```

**Características:**
- Pool de conexiones MySQL (10 conexiones)
- 5 triggers automáticos
- 1 vista SQL (student_report)
- Sistema de auditoría
- Transacciones con ROLLBACK

**Dependencias:**
- `mysql2/promise`
- `config.js`

**Usado por:** `main.js`

---

### 3. `main.js` - Proceso Principal de Electron

**Propósito:** Backend de la aplicación Electron

**Estructura:**
```javascript
// Variables globales
let mainWindow;
let db;

// Creación de ventana
function createWindow() { }

// Inicialización
app.whenReady()
app.on('window-all-closed')

// IPC HANDLERS
ipcMain.handle('get-all-students')
ipcMain.handle('create-student')
ipcMain.handle('update-student')
ipcMain.handle('delete-student')

ipcMain.handle('get-all-subjects')
ipcMain.handle('create-subject')
ipcMain.handle('delete-subject')

ipcMain.handle('get-all-grades')
ipcMain.handle('create-grade')
ipcMain.handle('update-grade')
ipcMain.handle('delete-grade')

ipcMain.handle('get-student-report')
ipcMain.handle('get-subject-statistics')
ipcMain.handle('get-audit-log')

ipcMain.handle('enroll-student-transaction')
ipcMain.handle('delete-student-transaction')

ipcMain.handle('check-db-connection')

ipcMain.on('window-minimize')
ipcMain.on('window-maximize')
ipcMain.on('window-close')
```

**Características:**
- Ventana sin marco (`frame: false`)
- 1400x900px (mínimo 1200x700)
- 19 handlers IPC registrados
- Controles de ventana personalizados

**Dependencias:**
- `electron`
- `database.js`

**Comunicación:** IPC con `renderer.js`

---

### 4. `renderer.js` - Proceso de Renderizado

**Propósito:** Frontend de la aplicación (lógica JavaScript)

**Estructura:**
```javascript
// Variables globales
let currentSection = 'students';
let editingStudentId = null;
let editingGradeId = null;
let allStudents = [];
let allSubjects = [];

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded')
setupWindowControls()
checkDatabaseConnection()
setupNavigation()
setupForms()
loadAllData()
setupConsole()
setupDemos()

// ESTUDIANTES
async loadStudents()
async handleStudentSubmit()
function editStudent()
function cancelStudentEdit()
async deleteStudent()

// MATERIAS
async loadSubjects()
async handleSubjectSubmit()
async deleteSubject()

// CALIFICACIONES
async loadGrades()
function updateGradeSelects()
async handleGradeSubmit()
function editGrade()
async updateGrade()
function cancelGradeEdit()
async deleteGrade()

// REPORTES
async loadReports()
async loadAuditLog()

// DEMOS DE TRANSACCIONES
function setupDemos()
function updateDemoSelects()
async handleDemoTransaction()
async handleDemoDelete()

// CONSOLA
function setupConsole()
function logToConsole()
function clearConsole()
function toggleConsole()

// Funciones globales exportadas
window.editStudent
window.deleteStudent
window.deleteSubject
window.editGrade
window.deleteGrade
```

**Características:**
- Comunicación IPC con `main.js`
- Manejo de formularios
- Actualización dinámica de UI
- Consola de MySQL en tiempo real
- Demo de transacciones

**Dependencias:**
- `electron` (ipcRenderer)
- Bootstrap 5.3.2
- Bootstrap Icons

**Usado por:** `index.html`

---

### 5. `index.html` - Interfaz de Usuario

**Propósito:** Estructura HTML de la aplicación

**Secciones principales:**
```html
<div class="custom-titlebar">        <!-- Barra de título -->
<header class="modern-header">       <!-- Header con estado DB -->
<nav class="modern-nav">              <!-- Navegación por pestañas -->
<main class="main-content">          <!-- Contenido principal -->
    <section id="section-students">  <!-- Estudiantes -->
    <section id="section-subjects">  <!-- Materias -->
    <section id="section-grades">    <!-- Calificaciones -->
    <section id="section-reports">   <!-- Reportes -->
    <section id="section-demo">      <!-- Demo SQL -->
</main>
<aside class="console-panel">        <!-- Consola MySQL -->
```

**Características:**
- 5 secciones principales
- Formularios reactivos
- Tablas con scroll
- Consola minimizable
- Badges con contadores

**Dependencias:**
- Bootstrap 5.3.2 (CSS + JS)
- Bootstrap Icons
- `styles.css`
- `renderer.js`

---

### 6. `styles.css` - Estilos y Tema Visual

**Propósito:** Diseño visual de la aplicación

**Estructura:**
```css
/* Variables CSS */
:root {
    /* Colores principales */
    /* Colores secundarios */
    /* Colores de estado */
    /* Colores neutros */
    /* Sombras */
    /* Bordes redondeados */
}

/* Tipografía */
@import Google Fonts (Inter, JetBrains Mono)

/* Componentes */
.custom-titlebar          /* Barra de título personalizada */
.modern-header            /* Header con gradiente */
.modern-nav               /* Navegación con pills */
.content-section          /* Secciones de contenido */
.card                     /* Tarjetas modernas */
.table                    /* Tablas con hover */
.form-control             /* Inputs y selects */
.btn                      /* Botones con gradientes */
.badge                    /* Badges con colores */
.console-panel            /* Panel de consola */
.alert                    /* Alertas modernas */

/* Utilidades */
/* Responsive */
/* Print styles */
/* Accessibility */
```

**Características:**
- Sistema de diseño con variables CSS
- Tipografía moderna (Inter + JetBrains Mono)
- Gradientes y sombras
- Animaciones suaves
- Responsive design
- Scrollbars personalizados

**Dependencias:**
- Google Fonts

---

## 🗄️ Esquema de Base de Datos

### Tablas

#### `students` - Estudiantes
```sql
id INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) NOT NULL
apellido VARCHAR(100) NOT NULL
matricula VARCHAR(20) UNIQUE NOT NULL
email VARCHAR(100)
fecha_ingreso DATE DEFAULT (CURRENT_DATE)
promedio_general DECIMAL(4,2) DEFAULT 0.00
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

INDEX idx_matricula
INDEX idx_nombre
```

#### `subjects` - Materias
```sql
id INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100) UNIQUE NOT NULL
creditos INT NOT NULL DEFAULT 3
promedio_materia DECIMAL(4,2) DEFAULT 0.00
total_estudiantes INT DEFAULT 0
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

INDEX idx_nombre
```

#### `grades` - Calificaciones
```sql
id INT PRIMARY KEY AUTO_INCREMENT
student_id INT NOT NULL
subject_id INT NOT NULL
calificacion DECIMAL(4,2) NOT NULL
periodo VARCHAR(20) DEFAULT 'Semestre 1'
fecha_evaluacion DATE DEFAULT (CURRENT_DATE)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
UNIQUE KEY unique_student_subject_periodo
CHECK (calificacion >= 0 AND calificacion <= 10)

INDEX idx_student
INDEX idx_subject
```

#### `grade_audit_log` - Auditoría
```sql
id INT PRIMARY KEY AUTO_INCREMENT
action VARCHAR(20) NOT NULL
table_name VARCHAR(50) NOT NULL
record_id INT
old_value TEXT
new_value TEXT
usuario VARCHAR(100) DEFAULT 'sistema'
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP

INDEX idx_timestamp
INDEX idx_action
```

### Vistas

#### `student_report` - Reporte de Estudiantes
```sql
SELECT
    s.id, s.nombre, s.apellido, s.matricula, s.promedio_general,
    COUNT(g.id) as total_materias,
    SUM(CASE WHEN g.calificacion >= 6 THEN 1 ELSE 0 END) as materias_aprobadas,
    SUM(CASE WHEN g.calificacion < 6 THEN 1 ELSE 0 END) as materias_reprobadas
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
GROUP BY s.id
```

### Triggers

1. **trg_validate_grade_before_insert**
   - Tipo: BEFORE INSERT
   - Tabla: grades
   - Función: Validar rango de calificación (0-10)

2. **trg_update_student_avg_after_insert**
   - Tipo: AFTER INSERT
   - Tabla: grades
   - Función: Actualizar promedio del estudiante + auditoría

3. **trg_update_student_avg_after_update**
   - Tipo: AFTER UPDATE
   - Tabla: grades
   - Función: Actualizar promedio del estudiante + auditoría

4. **trg_update_subject_stats_after_insert**
   - Tipo: AFTER INSERT
   - Tabla: grades
   - Función: Actualizar estadísticas de materia

5. **trg_audit_delete_grade**
   - Tipo: AFTER DELETE
   - Tabla: grades
   - Función: Registrar eliminación + actualizar promedio

---

## 🔄 Flujo de Datos

### Ejemplo: Crear un Estudiante

```
[UI] index.html
    └─> [Form Submit] student-form
        └─> [JS] renderer.js::handleStudentSubmit()
            └─> [IPC] ipcRenderer.invoke('create-student', datos)
                └─> [Backend] main.js::ipcMain.handle('create-student')
                    └─> [DB] database.js::createStudent()
                        └─> [MySQL] INSERT INTO students
                            └─> [Respuesta] result.insertId
                                └─> [Log] [SUCCESS] Estudiante creado
                └─> [Actualizar] renderer.js::loadStudents()
                    └─> [UI] Tabla actualizada
```

### Ejemplo: Registrar Calificación (con Triggers)

```
[UI] Formulario de calificación
    └─> [JS] renderer.js::handleGradeSubmit()
        └─> [IPC] ipcRenderer.invoke('create-grade')
            └─> [Backend] main.js::ipcMain.handle('create-grade')
                └─> [DB] database.js::createGrade()
                    └─> [MySQL] INSERT INTO grades
                        └─> [Trigger 1] trg_validate_grade_before_insert
                            ├─> Valida rango (0-10)
                        └─> [Trigger 2] trg_update_student_avg_after_insert
                            ├─> Actualiza promedio estudiante
                            └─> Registra en grade_audit_log
                        └─> [Trigger 3] trg_update_subject_stats_after_insert
                            ├─> Actualiza promedio materia
                            └─> Actualiza total estudiantes
    └─> [Actualizar] loadGrades() + loadStudents() + loadSubjects()
        └─> [UI] Todo actualizado automáticamente
```

---

## 📊 Diagramas

### Arquitectura General

```
┌─────────────────────────────────────────┐
│         ELECTRON APPLICATION            │
├─────────────────────────────────────────┤
│  ┌─────────────┐      ┌──────────────┐ │
│  │   Main      │ IPC  │   Renderer   │ │
│  │  Process    │◄────►│   Process    │ │
│  │  (main.js)  │      │(renderer.js) │ │
│  └──────┬──────┘      └──────┬───────┘ │
│         │                    │          │
│         │                    │          │
│  ┌──────▼──────┐      ┌──────▼───────┐ │
│  │  Database   │      │  index.html  │ │
│  │ (database.js)│      │ + styles.css │ │
│  └──────┬──────┘      └──────────────┘ │
└─────────┼──────────────────────────────┘
          │
    ┌─────▼─────┐
    │   MySQL   │
    │  Database │
    └───────────┘
```

### Relaciones de Base de Datos

```
┌─────────────┐
│  students   │
│─────────────│
│ id (PK)     │◄────┐
│ nombre      │     │
│ apellido    │     │
│ matricula   │     │
│ email       │     │  ┌─────────────┐
│ promedio    │     │  │   grades    │
└─────────────┘     │  │─────────────│
                    ├──│ id (PK)     │
┌─────────────┐     │  │ student_id  │──┐
│  subjects   │     │  │ subject_id  │  │
│─────────────│     │  │ calificacion│  │
│ id (PK)     │◄────┘  │ periodo     │  │
│ nombre      │        │ fecha       │  │
│ creditos    │        └─────────────┘  │
│ promedio    │                         │
│ total_est   │        ┌────────────────▼─────┐
└─────────────┘        │  grade_audit_log     │
                       │──────────────────────│
                       │ id (PK)              │
                       │ action               │
                       │ table_name           │
                       │ record_id            │
                       │ old_value, new_value │
                       │ timestamp            │
                       └──────────────────────┘
```

---

## 🔐 Consideraciones de Seguridad

### Datos Sensibles
- **Contraseña MySQL:** Almacenada en `config.js` (no versionada)
- **Conexiones:** Pool con límite de 10 conexiones

### Validaciones
- Calificaciones: 0-10 (trigger)
- Matrícula: UNIQUE constraint
- Foreign keys: Integridad referencial
- Transacciones: ROLLBACK automático en errores

### Electron Security
- `nodeIntegration: true` - ⚠️ Riesgo de seguridad
- `contextIsolation: false` - ⚠️ No recomendado para producción
- **Recomendación:** Revisar para producción

---

## 📦 Dependencias

### package.json

```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "mysql2": "^3.6.5"
  },
  "devDependencies": {}
}
```

### CDN (en HTML)
- Bootstrap 5.3.2 CSS
- Bootstrap 5.3.2 JS
- Bootstrap Icons 1.11.1
- Google Fonts (Inter, JetBrains Mono)

---

## 🚀 Puntos de Entrada

### Desarrollo
```bash
npm start
```

**Secuencia de inicio:**
1. `package.json` → `main: "main.js"`
2. `main.js` → Inicializa Electron
3. `database.js` → Conecta a MySQL
4. `main.js::createWindow()` → Carga `index.html`
5. `index.html` → Carga `renderer.js` y `styles.css`
6. `renderer.js::DOMContentLoaded` → Inicializa UI

### Producción (TO DO)
- Empaquetar con `electron-builder`
- Crear instalador para Windows
- Configurar auto-update

---

**Última actualización:** 2025-01-20
**Versión:** 1.0.0
