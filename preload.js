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
