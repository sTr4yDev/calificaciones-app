/**
 * RENDERER.JS - Proceso de Renderizado (Frontend)
 * Maneja toda la interfaz de usuario y comunicacion con el proceso principal
 */

const { ipcRenderer } = require('electron');

// ==================== VARIABLES GLOBALES ====================
let currentSection = 'students';
let editingStudentId = null;
let editingGradeId = null;
let allStudents = [];
let allSubjects = [];

// ==================== INICIALIZACION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Renderer.js cargado');

    // Configurar controles de ventana
    setupWindowControls();

    // Verificar conexion a la base de datos
    await checkDatabaseConnection();

    // Configurar navegacion
    setupNavigation();

    // Configurar formularios
    setupForms();

    // Cargar datos iniciales
    await loadAllData();

    // Configurar consola
    setupConsole();

    // Configurar demos de transacciones
    setupDemos();

    logToConsole('Sistema listo para usar', 'success');
});

// ==================== CONTROLES DE VENTANA ====================
function setupWindowControls() {
    // Botón minimizar
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });

    // Botón maximizar/restaurar
    document.getElementById('maximize-btn').addEventListener('click', () => {
        ipcRenderer.send('window-maximize');
    });

    // Botón cerrar
    document.getElementById('close-btn').addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });
}

// ==================== CONEXION BASE DE DATOS ====================
async function checkDatabaseConnection() {
    const statusBadge = document.getElementById('database-status');

    try {
        const result = await ipcRenderer.invoke('check-db-connection');

        if (result.connected) {
            statusBadge.innerHTML = `
                <span class="badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600;">
                    <i class="bi bi-database-check"></i> MySQL Conectado
                </span>
            `;
            logToConsole('Conectado a MySQL exitosamente', 'success');
        } else {
            statusBadge.innerHTML = `
                <span class="badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600;">
                    <i class="bi bi-database-x"></i> MySQL Desconectado
                </span>
            `;
            logToConsole(`Error de conexion: ${result.message}`, 'error');
        }
    } catch (error) {
        statusBadge.innerHTML = `
            <span class="badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600;">
                <i class="bi bi-exclamation-triangle"></i> Error MySQL
            </span>
        `;
        logToConsole(`Error conectando a MySQL: ${error.message}`, 'error');
    }
}

// ==================== NAVEGACION ====================
function setupNavigation() {
    const navButtons = document.querySelectorAll('[data-section]');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            switchSection(section);

            // Actualizar navegacion activa
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function switchSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Mostrar seccion seleccionada
    document.getElementById(`section-${section}`).classList.add('active');
    currentSection = section;

    logToConsole(`Cambio a seccion: ${section}`, 'info');
}

// ==================== CONFIGURAR FORMULARIOS ====================
function setupForms() {
    // Formulario de estudiantes
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);
    document.getElementById('cancel-student-edit').addEventListener('click', cancelStudentEdit);

    // Formulario de materias
    document.getElementById('subject-form').addEventListener('submit', handleSubjectSubmit);

    // Formulario de calificaciones
    document.getElementById('grade-form').addEventListener('submit', handleGradeSubmit);
    document.getElementById('cancel-grade-edit').addEventListener('click', cancelGradeEdit);
}

// ==================== CARGAR TODOS LOS DATOS ====================
async function loadAllData() {
    try {
        await Promise.all([
            loadStudents(),
            loadSubjects(),
            loadGrades(),
            loadReports(),
            loadAuditLog()
        ]);

        logToConsole('Todos los datos cargados correctamente', 'success');
    } catch (error) {
        logToConsole(`Error cargando datos: ${error.message}`, 'error');
    }
}

// ==================== ESTUDIANTES ====================
async function loadStudents() {
    try {
        allStudents = await ipcRenderer.invoke('get-all-students');

        const tbody = document.getElementById('students-list');
        tbody.innerHTML = '';

        if (allStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay estudiantes registrados</td></tr>';
            document.getElementById('students-count').textContent = '0';
            return;
        }

        allStudents.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${student.matricula}</strong></td>
                <td>${student.nombre} ${student.apellido}</td>
                <td><small>${student.email || 'N/A'}</small></td>
                <td>
                    <span class="badge ${student.promedio_general >= 8 ? 'bg-success' : student.promedio_general >= 6 ? 'bg-warning' : 'bg-danger'}">
                        ${parseFloat(student.promedio_general).toFixed(2)}
                    </span>
                </td>
                <td>
                    <small>${student.total_calificaciones} inscritas</small><br>
                    <small class="text-success">${student.materias_aprobadas} aprobadas</small>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editStudent(${student.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id}, '${student.nombre} ${student.apellido}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Actualizar contador
        document.getElementById('students-count').textContent = allStudents.length;

        // Actualizar estadisticas
        const totalStudents = allStudents.length;
        const avgGeneral = allStudents.reduce((sum, s) => sum + parseFloat(s.promedio_general), 0) / totalStudents;

        document.getElementById('stat-total-students').textContent = totalStudents;
        document.getElementById('stat-avg-general').textContent = avgGeneral.toFixed(2);

    } catch (error) {
        logToConsole(`Error cargando estudiantes: ${error.message}`, 'error');
    }
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('student-nombre').value.trim();
    const apellido = document.getElementById('student-apellido').value.trim();
    const matricula = document.getElementById('student-matricula').value.trim();
    const email = document.getElementById('student-email').value.trim();

    try {
        if (editingStudentId) {
            await ipcRenderer.invoke('update-student', editingStudentId, nombre, apellido, email);
            logToConsole(`Estudiante actualizado: ${nombre} ${apellido}`, 'success');
            cancelStudentEdit();
        } else {
            await ipcRenderer.invoke('create-student', nombre, apellido, matricula, email);
            logToConsole(`Estudiante creado: ${nombre} ${apellido} (${matricula})`, 'success');
        }

        document.getElementById('student-form').reset();
        await loadStudents();
        await loadReports();

    } catch (error) {
        logToConsole(`Error: ${error.message}`, 'error');
        alert(`Error: ${error.message}`);
    }
}

function editStudent(id) {
    const student = allStudents.find(s => s.id === id);
    if (!student) return;

    editingStudentId = id;

    document.getElementById('student-id').value = student.id;
    document.getElementById('student-nombre').value = student.nombre;
    document.getElementById('student-apellido').value = student.apellido;
    document.getElementById('student-matricula').value = student.matricula;
    document.getElementById('student-matricula').disabled = true;
    document.getElementById('student-email').value = student.email || '';

    document.getElementById('student-form-title').innerHTML = '<i class="bi bi-pencil"></i> Editar Estudiante';
    document.getElementById('cancel-student-edit').classList.remove('d-none');

    logToConsole(`Editando estudiante: ${student.nombre} ${student.apellido}`, 'info');
}

function cancelStudentEdit() {
    editingStudentId = null;
    document.getElementById('student-form').reset();
    document.getElementById('student-matricula').disabled = false;
    document.getElementById('student-form-title').innerHTML = '<i class="bi bi-person-plus-fill"></i> Nuevo Estudiante';
    document.getElementById('cancel-student-edit').classList.add('d-none');
}

async function deleteStudent(id, nombre) {
    if (!confirm(`Eliminar estudiante "${nombre}" y todas sus calificaciones?`)) return;

    try {
        await ipcRenderer.invoke('delete-student', id);
        logToConsole(`Estudiante eliminado: ${nombre}`, 'warning');
        await loadStudents();
        await loadGrades();
        await loadReports();
        await loadAuditLog();
    } catch (error) {
        logToConsole(`Error eliminando estudiante: ${error.message}`, 'error');
    }
}

// ==================== MATERIAS ====================
async function loadSubjects() {
    try {
        allSubjects = await ipcRenderer.invoke('get-all-subjects');

        const tbody = document.getElementById('subjects-list');
        tbody.innerHTML = '';

        if (allSubjects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay materias registradas</td></tr>';
            document.getElementById('subjects-count').textContent = '0';
            return;
        }

        allSubjects.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${subject.nombre}</strong></td>
                <td><span class="badge bg-info">${subject.creditos} creditos</span></td>
                <td>
                    <span class="badge ${subject.promedio_materia >= 8 ? 'bg-success' : subject.promedio_materia >= 6 ? 'bg-warning' : 'bg-danger'}">
                        ${parseFloat(subject.promedio_materia).toFixed(2)}
                    </span>
                </td>
                <td>${subject.total_estudiantes} estudiantes</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteSubject(${subject.id}, '${subject.nombre}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Actualizar contador
        document.getElementById('subjects-count').textContent = allSubjects.length;

        // Actualizar selects de calificaciones
        updateGradeSelects();
        updateDemoSelects();

    } catch (error) {
        logToConsole(`Error cargando materias: ${error.message}`, 'error');
    }
}

async function handleSubjectSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('subject-nombre').value.trim();
    const creditos = parseInt(document.getElementById('subject-creditos').value);

    try {
        await ipcRenderer.invoke('create-subject', nombre, creditos);
        logToConsole(`Materia creada: ${nombre} (${creditos} creditos)`, 'success');

        document.getElementById('subject-form').reset();
        await loadSubjects();
        await loadReports();

    } catch (error) {
        logToConsole(`Error: ${error.message}`, 'error');
        alert(`Error: ${error.message}`);
    }
}

async function deleteSubject(id, nombre) {
    if (!confirm(`Eliminar materia "${nombre}" y todas sus calificaciones asociadas?`)) return;

    try {
        await ipcRenderer.invoke('delete-subject', id);
        logToConsole(`Materia eliminada: ${nombre}`, 'warning');
        await loadSubjects();
        await loadGrades();
        await loadReports();
    } catch (error) {
        logToConsole(`Error eliminando materia: ${error.message}`, 'error');
    }
}

// ==================== CALIFICACIONES ====================
async function loadGrades() {
    try {
        const grades = await ipcRenderer.invoke('get-all-grades');

        const tbody = document.getElementById('grades-list');
        tbody.innerHTML = '';

        if (grades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay calificaciones registradas</td></tr>';
            document.getElementById('grades-count').textContent = '0';
            return;
        }

        grades.forEach(grade => {
            const row = document.createElement('tr');
            const statusClass = grade.status === 'Aprobado' ? 'success' : 'danger';
            const fecha = new Date(grade.fecha_evaluacion).toLocaleDateString();

            row.innerHTML = `
                <td><small>${grade.student_name}<br><span class="text-muted">${grade.matricula}</span></small></td>
                <td><strong>${grade.subject_name}</strong></td>
                <td>
                    <span class="badge bg-${grade.calificacion >= 8 ? 'success' : grade.calificacion >= 6 ? 'warning' : 'danger'} fs-6">
                        ${parseFloat(grade.calificacion).toFixed(1)}
                    </span>
                </td>
                <td><small>${grade.periodo}</small></td>
                <td><span class="badge bg-${statusClass}">${grade.status}</span></td>
                <td><small>${fecha}</small></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editGrade(${grade.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGrade(${grade.id}, '${grade.student_name}', '${grade.subject_name}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Actualizar contador
        document.getElementById('grades-count').textContent = grades.length;

    } catch (error) {
        logToConsole(`Error cargando calificaciones: ${error.message}`, 'error');
    }
}

function updateGradeSelects() {
    // Select de estudiantes
    const studentSelect = document.getElementById('grade-student');
    studentSelect.innerHTML = '<option value="">-- Seleccionar --</option>';

    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.nombre} ${student.apellido} (${student.matricula})`;
        studentSelect.appendChild(option);
    });

    // Select de materias
    const subjectSelect = document.getElementById('grade-subject');
    subjectSelect.innerHTML = '<option value="">-- Seleccionar --</option>';

    allSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = `${subject.nombre} (${subject.creditos} creditos)`;
        subjectSelect.appendChild(option);
    });
}

async function handleGradeSubmit(e) {
    e.preventDefault();

    const studentId = parseInt(document.getElementById('grade-student').value);
    const subjectId = parseInt(document.getElementById('grade-subject').value);
    const calificacion = parseFloat(document.getElementById('grade-calificacion').value);
    const periodo = document.getElementById('grade-periodo').value;

    if (!studentId || !subjectId) {
        alert('Por favor selecciona un estudiante y una materia');
        return;
    }

    try {
        if (editingGradeId) {
            await ipcRenderer.invoke('update-grade', editingGradeId, calificacion);
            logToConsole(`Calificacion actualizada: ${calificacion}`, 'success');
            cancelGradeEdit();
        } else {
            await ipcRenderer.invoke('create-grade', studentId, subjectId, calificacion, periodo);
            logToConsole(`Calificacion registrada: ${calificacion} (Triggers automaticos ejecutados)`, 'success');
        }

        document.getElementById('grade-form').reset();
        await loadGrades();
        await loadStudents();
        await loadSubjects();
        await loadReports();
        await loadAuditLog();

    } catch (error) {
        logToConsole(`Error: ${error.message}`, 'error');
        alert(`Error: ${error.message}`);
    }
}

function editGrade(id) {
    const newGrade = prompt('Nueva calificacion (0-10):');
    if (newGrade === null) return;

    const grade = parseFloat(newGrade);
    if (isNaN(grade) || grade < 0 || grade > 10) {
        alert('Calificacion invalida. Debe estar entre 0 y 10.');
        return;
    }

    editingGradeId = id;
    updateGrade(id, grade);
}

async function updateGrade(id, calificacion) {
    try {
        await ipcRenderer.invoke('update-grade', id, calificacion);
        logToConsole(`Calificacion actualizada: ${calificacion}`, 'success');

        await loadGrades();
        await loadStudents();
        await loadReports();
        await loadAuditLog();

        editingGradeId = null;
    } catch (error) {
        logToConsole(`Error actualizando calificacion: ${error.message}`, 'error');
    }
}

function cancelGradeEdit() {
    editingGradeId = null;
    document.getElementById('grade-form').reset();
    document.getElementById('grade-form-title').innerHTML = '<i class="bi bi-pencil-square"></i> Nueva Calificacion';
    document.getElementById('cancel-grade-edit').classList.add('d-none');
}

async function deleteGrade(id, studentName, subjectName) {
    if (!confirm(`Eliminar calificacion de "${studentName}" en "${subjectName}"?`)) return;

    try {
        await ipcRenderer.invoke('delete-grade', id);
        logToConsole(`Calificacion eliminada: ${studentName} - ${subjectName}`, 'warning');

        await loadGrades();
        await loadStudents();
        await loadReports();
        await loadAuditLog();
    } catch (error) {
        logToConsole(`Error eliminando calificacion: ${error.message}`, 'error');
    }
}

// ==================== REPORTES ====================
async function loadReports() {
    try {
        // Reporte de estudiantes
        const studentReport = await ipcRenderer.invoke('get-student-report');
        const studentsBody = document.getElementById('report-students');
        studentsBody.innerHTML = '';

        if (studentReport.length === 0) {
            studentsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos</td></tr>';
        } else {
            studentReport.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><small><strong>${student.nombre} ${student.apellido}</strong><br>${student.matricula}</small></td>
                    <td>
                        <span class="badge ${student.promedio_general >= 8 ? 'bg-success' : student.promedio_general >= 6 ? 'bg-warning' : 'bg-danger'}">
                            ${parseFloat(student.promedio_general).toFixed(2)}
                        </span>
                    </td>
                    <td class="text-success"><strong>${student.materias_aprobadas}</strong></td>
                    <td class="text-danger"><strong>${student.materias_reprobadas}</strong></td>
                `;
                studentsBody.appendChild(row);
            });
        }

        // Estadisticas de materias
        const subjectStats = await ipcRenderer.invoke('get-subject-statistics');
        const subjectsBody = document.getElementById('report-subjects');
        subjectsBody.innerHTML = '';

        if (subjectStats.length === 0) {
            subjectsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos</td></tr>';
        } else {
            subjectStats.forEach(subject => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${subject.nombre}</strong><br><small>${subject.creditos} creditos</small></td>
                    <td>
                        <span class="badge ${subject.promedio_materia >= 8 ? 'bg-success' : subject.promedio_materia >= 6 ? 'bg-warning' : 'bg-danger'}">
                            ${parseFloat(subject.promedio_materia).toFixed(2)}
                        </span>
                    </td>
                    <td class="text-success"><strong>${subject.aprobados || 0}</strong></td>
                    <td class="text-danger"><strong>${subject.reprobados || 0}</strong></td>
                `;
                subjectsBody.appendChild(row);
            });
        }

    } catch (error) {
        logToConsole(`Error cargando reportes: ${error.message}`, 'error');
    }
}

async function loadAuditLog() {
    try {
        const auditLog = await ipcRenderer.invoke('get-audit-log', 50);
        const tbody = document.getElementById('audit-log');
        tbody.innerHTML = '';

        if (auditLog.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin registros de auditoria</td></tr>';
            return;
        }

        auditLog.forEach(log => {
            const row = document.createElement('tr');
            const actionClass = log.action === 'INSERT' ? 'success' : log.action === 'UPDATE' ? 'warning' : 'danger';
            const timestamp = new Date(log.timestamp).toLocaleString();

            row.innerHTML = `
                <td><span class="badge bg-${actionClass}">${log.action}</span></td>
                <td><code>${log.table_name}</code></td>
                <td><small>${log.new_value || log.old_value || 'N/A'}</small></td>
                <td><small>${timestamp}</small></td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        logToConsole(`Error cargando log de auditoria: ${error.message}`, 'error');
    }
}

// ==================== DEMOS DE TRANSACCIONES ====================
function setupDemos() {
    updateDemoSelects();

    document.getElementById('demo-transaction-btn').addEventListener('click', handleDemoTransaction);
    document.getElementById('demo-delete-btn').addEventListener('click', handleDemoDelete);
}

function updateDemoSelects() {
    // Select para transaccion
    const demoStudent = document.getElementById('demo-student');
    demoStudent.innerHTML = '<option value="">-- Seleccionar --</option>';

    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.nombre} ${student.apellido}`;
        demoStudent.appendChild(option);
    });

    // Select para eliminacion
    const demoDeleteStudent = document.getElementById('demo-delete-student');
    demoDeleteStudent.innerHTML = '<option value="">-- Seleccionar --</option>';

    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.nombre} ${student.apellido}`;
        demoDeleteStudent.appendChild(option);
    });

    // Crear checkboxes de materias
    const container = document.getElementById('demo-subjects-container');
    container.innerHTML = '';

    allSubjects.forEach(subject => {
        const div = document.createElement('div');
        div.className = 'input-group input-group-sm mb-2';
        div.innerHTML = `
            <div class="input-group-text">
                <input class="form-check-input mt-0 demo-subject-check" type="checkbox"
                       value="${subject.id}" data-subject="${subject.nombre}">
            </div>
            <span class="form-control">${subject.nombre}</span>
            <input type="number" class="form-control demo-subject-grade"
                   placeholder="Nota" min="0" max="10" step="0.1"
                   data-subject-id="${subject.id}" disabled>
        `;
        container.appendChild(div);
    });

    // Habilitar/deshabilitar inputs de calificacion
    document.querySelectorAll('.demo-subject-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const subjectId = e.target.value;
            const gradeInput = document.querySelector(`.demo-subject-grade[data-subject-id="${subjectId}"]`);
            gradeInput.disabled = !e.target.checked;
            if (!e.target.checked) gradeInput.value = '';
        });
    });
}

async function handleDemoTransaction() {
    const studentId = parseInt(document.getElementById('demo-student').value);

    if (!studentId) {
        alert('Por favor selecciona un estudiante');
        return;
    }

    const checkedSubjects = document.querySelectorAll('.demo-subject-check:checked');

    if (checkedSubjects.length === 0) {
        alert('Por favor selecciona al menos una materia');
        return;
    }

    const subjectIds = [];
    const grades = [];

    checkedSubjects.forEach(checkbox => {
        const subjectId = parseInt(checkbox.value);
        const gradeInput = document.querySelector(`.demo-subject-grade[data-subject-id="${subjectId}"]`);
        const grade = parseFloat(gradeInput.value);

        if (isNaN(grade)) {
            alert(`Por favor ingresa una calificacion valida para ${checkbox.dataset.subject}`);
            return;
        }

        subjectIds.push(subjectId);
        grades.push(grade);
    });

    const resultDiv = document.getElementById('demo-transaction-result');

    try {
        logToConsole('START TRANSACTION - Inscripcion multiple...', 'info');

        await ipcRenderer.invoke('enroll-student-transaction', studentId, subjectIds, grades);

        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i> <strong>COMMIT</strong><br>
                Transaccion completada exitosamente. ${subjectIds.length} calificaciones registradas.
            </div>
        `;

        logToConsole('COMMIT - Transaccion exitosa', 'success');

        // Recargar datos
        await loadAllData();

        // Limpiar formulario
        document.querySelectorAll('.demo-subject-check').forEach(cb => cb.checked = false);
        document.querySelectorAll('.demo-subject-grade').forEach(input => {
            input.value = '';
            input.disabled = true;
        });

    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle"></i> <strong>ROLLBACK</strong><br>
                ${error.message}
            </div>
        `;

        logToConsole(`ROLLBACK - ${error.message}`, 'error');
    }
}

async function handleDemoDelete() {
    const studentId = parseInt(document.getElementById('demo-delete-student').value);

    if (!studentId) {
        alert('Por favor selecciona un estudiante');
        return;
    }

    const student = allStudents.find(s => s.id === studentId);

    if (!confirm(`REALMENTE deseas eliminar a "${student.nombre} ${student.apellido}" y todas sus calificaciones?`)) {
        return;
    }

    const resultDiv = document.getElementById('demo-delete-result');

    try {
        logToConsole(`START TRANSACTION - Eliminando estudiante ${studentId}...`, 'info');

        await ipcRenderer.invoke('delete-student-transaction', studentId);

        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i> <strong>COMMIT</strong><br>
                Estudiante y todas sus calificaciones eliminados correctamente.
            </div>
        `;

        logToConsole('COMMIT - Eliminacion exitosa', 'success');

        // Recargar datos
        await loadAllData();

        document.getElementById('demo-delete-student').value = '';

    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle"></i> <strong>ROLLBACK</strong><br>
                ${error.message}
            </div>
        `;

        logToConsole(`ROLLBACK - ${error.message}`, 'error');
    }
}

// ==================== CONSOLA ====================
function setupConsole() {
    document.getElementById('clear-console').addEventListener('click', clearConsole);
    document.getElementById('toggle-console').addEventListener('click', toggleConsole);
}

function logToConsole(message, type = 'info') {
    const output = document.getElementById('console-output');
    const timestamp = new Date().toLocaleTimeString();

    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="message">${message}</span>
    `;

    output.appendChild(line);
    output.scrollTop = output.scrollHeight;

    // Limitar a 100 lineas
    const lines = output.querySelectorAll('.console-line');
    if (lines.length > 100) {
        lines[0].remove();
    }
}

function clearConsole() {
    const output = document.getElementById('console-output');
    output.innerHTML = `
        <div class="console-line system">
            <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
            <span class="message">Consola limpiada</span>
        </div>
    `;
}

function toggleConsole() {
    const panel = document.getElementById('console-panel');
    const icon = document.querySelector('#toggle-console i');

    panel.classList.toggle('minimized');

    if (panel.classList.contains('minimized')) {
        icon.className = 'bi bi-arrows-angle-expand';
    } else {
        icon.className = 'bi bi-arrows-angle-contract';
    }
}

// Exponer funciones globales para botones HTML
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.deleteSubject = deleteSubject;
window.editGrade = editGrade;
window.deleteGrade = deleteGrade;
