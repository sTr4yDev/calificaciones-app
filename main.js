/**
 * MAIN.JS - Proceso Principal de Electron
 * Gestiona la ventana principal y la comunicacion con el backend
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const CalificacionesDB = require('./database.js');

let mainWindow;
let db;

// Crear ventana principal
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        backgroundColor: '#f8f9fa',
        frame: false, // Ventana sin borde para controles personalizados
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets', 'icon.png') // opcional
    });

    mainWindow.loadFile('index.html');

    // Abrir DevTools en modo desarrollo (opcional)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Mostrar ventana cuando este lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    console.log('[APP] Ventana principal creada');
}

// Inicializar aplicacion
app.whenReady().then(async () => {
    console.log('='.repeat(60));
    console.log('[APP] Aplicacion Electron iniciada');
    console.log('='.repeat(60));

    // Inicializar base de datos
    try {
        db = new CalificacionesDB();
    } catch (error) {
        console.error('[ERROR] Error inicializando base de datos:', error);
    }

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Cerrar cuando todas las ventanas esten cerradas (excepto en macOS)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (db && db.pool) {
            db.pool.end();
            console.log('[APP] Conexion a base de datos cerrada');
        }
        app.quit();
    }
});

// ==================== IPC HANDLERS - ESTUDIANTES ====================

ipcMain.handle('get-all-students', async () => {
    try {
        return await db.getAllStudents();
    } catch (error) {
        console.error('[ERROR] Error obteniendo estudiantes:', error);
        throw error;
    }
});

ipcMain.handle('create-student', async (event, nombre, apellido, matricula, email) => {
    try {
        return await db.createStudent(nombre, apellido, matricula, email);
    } catch (error) {
        console.error('[ERROR] Error creando estudiante:', error);
        throw error;
    }
});

ipcMain.handle('update-student', async (event, id, nombre, apellido, email) => {
    try {
        return await db.updateStudent(id, nombre, apellido, email);
    } catch (error) {
        console.error('[ERROR] Error actualizando estudiante:', error);
        throw error;
    }
});

ipcMain.handle('delete-student', async (event, id) => {
    try {
        return await db.deleteStudent(id);
    } catch (error) {
        console.error('[ERROR] Error eliminando estudiante:', error);
        throw error;
    }
});

// ==================== IPC HANDLERS - MATERIAS ====================

ipcMain.handle('get-all-subjects', async () => {
    try {
        return await db.getAllSubjects();
    } catch (error) {
        console.error('[ERROR] Error obteniendo materias:', error);
        throw error;
    }
});

ipcMain.handle('create-subject', async (event, nombre, creditos) => {
    try {
        return await db.createSubject(nombre, creditos);
    } catch (error) {
        console.error('[ERROR] Error creando materia:', error);
        throw error;
    }
});

ipcMain.handle('delete-subject', async (event, id) => {
    try {
        return await db.deleteSubject(id);
    } catch (error) {
        console.error('[ERROR] Error eliminando materia:', error);
        throw error;
    }
});

// ==================== IPC HANDLERS - CALIFICACIONES ====================

ipcMain.handle('get-all-grades', async () => {
    try {
        return await db.getAllGrades();
    } catch (error) {
        console.error('[ERROR] Error obteniendo calificaciones:', error);
        throw error;
    }
});

ipcMain.handle('create-grade', async (event, studentId, subjectId, calificacion, periodo) => {
    try {
        return await db.createGrade(studentId, subjectId, calificacion, periodo);
    } catch (error) {
        console.error('[ERROR] Error creando calificacion:', error);
        throw error;
    }
});

ipcMain.handle('update-grade', async (event, id, calificacion) => {
    try {
        return await db.updateGrade(id, calificacion);
    } catch (error) {
        console.error('[ERROR] Error actualizando calificacion:', error);
        throw error;
    }
});

ipcMain.handle('delete-grade', async (event, id) => {
    try {
        return await db.deleteGrade(id);
    } catch (error) {
        console.error('[ERROR] Error eliminando calificacion:', error);
        throw error;
    }
});

// ==================== IPC HANDLERS - REPORTES ====================

ipcMain.handle('get-student-report', async () => {
    try {
        return await db.getStudentReport();
    } catch (error) {
        console.error('[ERROR] Error obteniendo reporte de estudiantes:', error);
        throw error;
    }
});

ipcMain.handle('get-subject-statistics', async () => {
    try {
        return await db.getSubjectStatistics();
    } catch (error) {
        console.error('[ERROR] Error obteniendo estadisticas de materias:', error);
        throw error;
    }
});

ipcMain.handle('get-audit-log', async (event, limit) => {
    try {
        return await db.getAuditLog(limit);
    } catch (error) {
        console.error('[ERROR] Error obteniendo log de auditoria:', error);
        throw error;
    }
});

// ==================== IPC HANDLERS - TRANSACCIONES ====================

ipcMain.handle('enroll-student-transaction', async (event, studentId, subjectIds, grades) => {
    try {
        return await db.enrollStudentWithTransaction(studentId, subjectIds, grades);
    } catch (error) {
        console.error('[ERROR] Error en transaccion de inscripcion:', error);
        throw error;
    }
});

ipcMain.handle('delete-student-transaction', async (event, studentId) => {
    try {
        return await db.deleteStudentWithGradesTransaction(studentId);
    } catch (error) {
        console.error('[ERROR] Error en transaccion de eliminacion:', error);
        throw error;
    }
});

// ==================== IPC HANDLERS - STATUS ====================

ipcMain.handle('check-db-connection', async () => {
    try {
        if (db && db.pool) {
            const connection = await db.pool.getConnection();
            connection.release();
            return { connected: true, message: 'Conexion exitosa' };
        }
        return { connected: false, message: 'Base de datos no inicializada' };
    } catch (error) {
        return { connected: false, message: error.message };
    }
});

// ==================== IPC HANDLERS - CONTROLES DE VENTANA ====================

ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

console.log('[APP] IPC Handlers registrados correctamente');
console.log('='.repeat(60));
