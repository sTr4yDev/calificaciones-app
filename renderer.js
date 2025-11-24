/**
 * RENDERER.JS - Proceso de Renderizado (Frontend)
 * Maneja toda la interfaz de usuario y comunicacion con el proceso principal
 */

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
});

// ==================== CONTROLES DE VENTANA ====================
function setupWindowControls() {
    // Botón minimizar
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    // Botón maximizar/restaurar
    document.getElementById('maximize-btn').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });

    // Botón cerrar
    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
}

// ==================== CONEXION BASE DE DATOS ====================
async function checkDatabaseConnection() {
    const statusBadge = document.getElementById('database-status');

    try {
        const result = await window.electronAPI.checkDbConnection();

        if (result.connected) {
            statusBadge.innerHTML = `
                <span class="badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600;">
                    <i class="bi bi-database-check"></i> MySQL Conectado
                </span>
            `;
        } else {
            statusBadge.innerHTML = `
                <span class="badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600;">
                    <i class="bi bi-database-x"></i> MySQL Desconectado
                </span>
            `;
        }
    } catch (error) {
        statusBadge.innerHTML = `
            <span class="badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600;">
                <i class="bi bi-exclamation-triangle"></i> Error MySQL
            </span>
        `;
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
}

// ==================== CONFIGURAR FORMULARIOS ====================
function setupForms() {
    // Formulario de estudiantes
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);
    document.getElementById('cancel-student-edit').addEventListener('click', cancelStudentEdit);

    // Listener para generar email automáticamente al escribir matrícula
    const matriculaInput = document.getElementById('student-matricula');
    const emailInput = document.getElementById('student-email');

    matriculaInput.addEventListener('input', (e) => {
        const matricula = e.target.value.trim();
        if (matricula.length === 8 && /^[0-9]{8}$/.test(matricula)) {
            emailInput.value = `l${matricula}@zacatepec.tecnm.mx`;
        } else if (matricula.length === 0) {
            emailInput.value = '';
        }
    });

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
    } catch (error) {
        console.error(`Error cargando datos: ${error.message}`);
    }
}

// ==================== ESTUDIANTES ====================
async function loadStudents() {
    try {
        allStudents = await window.electronAPI.getAllStudents();

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
                    <span class="badge ${student.promedio_general >= 80 ? 'bg-success' : student.promedio_general >= 70 ? 'bg-warning' : 'bg-danger'}">
                        ${parseFloat(student.promedio_general).toFixed(1)}
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
        document.getElementById('stat-avg-general').textContent = avgGeneral.toFixed(1);

    } catch (error) {
        console.error(`Error cargando estudiantes: ${error.message}`);
    }
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('student-nombre').value.trim();
    const apellido1 = document.getElementById('student-apellido1').value.trim();
    const apellido2 = document.getElementById('student-apellido2').value.trim();
    const matricula = document.getElementById('student-matricula').value.trim();
    const email = document.getElementById('student-email').value.trim();

    // Validaciones
    if (!nombre) {
        alert('El nombre es obligatorio');
        return;
    }

    if (!apellido1) {
        alert('El primer apellido es obligatorio');
        return;
    }

    if (!matricula) {
        alert('La matrícula es obligatoria');
        return;
    }

    // Validar matrícula: exactamente 8 dígitos numéricos
    if (!/^[0-9]{8}$/.test(matricula)) {
        alert('La matrícula debe tener exactamente 8 dígitos numéricos');
        return;
    }

    if (!email) {
        alert('El email es obligatorio');
        return;
    }

    // Concatenar apellidos
    const apellido = apellido2 ? `${apellido1} ${apellido2}` : apellido1;

    // Si es un nuevo estudiante, verificar matrícula duplicada
    if (!editingStudentId) {
        const matriculaDuplicada = allStudents.find(s => s.matricula === matricula);
        if (matriculaDuplicada) {
            alert(`Error: La matrícula "${matricula}" ya está registrada.\n\nEstudiante: ${matriculaDuplicada.nombre} ${matriculaDuplicada.apellido}`);
            return;
        }
    }

    try {
        if (editingStudentId) {
            await window.electronAPI.updateStudent(editingStudentId, nombre, apellido, email);
            alert(`Estudiante "${nombre} ${apellido}" actualizado exitosamente.`);
            cancelStudentEdit();
        } else {
            await window.electronAPI.createStudent(nombre, apellido, matricula, email);
            alert(`Estudiante "${nombre} ${apellido}" creado exitosamente.\nMatrícula: ${matricula}`);
        }

        document.getElementById('student-form').reset();
        await loadStudents();
        await updateGradeSelects();
        await loadReports();

    } catch (error) {
        console.error(`Error: ${error.message}`);

        // Manejar errores específicos
        if (error.message.includes('Duplicate entry') && error.message.includes('matricula')) {
            alert(`Error: La matrícula "${matricula}" ya está registrada en la base de datos.\n\nPor favor, verifica el número de matrícula.`);
        } else if (error.message.includes('Duplicate entry')) {
            alert(`Error: Ya existe un registro con los datos proporcionados.`);
        } else {
            alert(`Error al guardar el estudiante: ${error.message}`);
        }
    }
}

function editStudent(id) {
    const student = allStudents.find(s => s.id === id);
    if (!student) return;

    editingStudentId = id;

    // Separar apellidos (si hay espacio, dividir en dos partes)
    const apellidos = student.apellido.split(' ');
    const apellido1 = apellidos[0] || '';
    const apellido2 = apellidos.slice(1).join(' ') || '';

    document.getElementById('student-id').value = student.id;
    document.getElementById('student-nombre').value = student.nombre;
    document.getElementById('student-apellido1').value = apellido1;
    document.getElementById('student-apellido2').value = apellido2;
    document.getElementById('student-matricula').value = student.matricula;
    document.getElementById('student-matricula').disabled = true;
    document.getElementById('student-email').value = student.email || '';

    document.getElementById('student-form-title').innerHTML = '<i class="bi bi-pencil"></i> Editar Estudiante';
    document.getElementById('cancel-student-edit').classList.remove('d-none');
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
        await window.electronAPI.deleteStudent(id);
        await loadStudents();
        await loadGrades();
        await loadReports();
        await loadAuditLog();
    } catch (error) {
        console.error(`Error eliminando estudiante: ${error.message}`);
    }
}

// ==================== MATERIAS ====================
async function loadSubjects() {
    try {
        allSubjects = await window.electronAPI.getAllSubjects();

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
                    <span class="badge ${subject.promedio_materia >= 80 ? 'bg-success' : subject.promedio_materia >= 70 ? 'bg-warning' : 'bg-danger'}">
                        ${parseFloat(subject.promedio_materia).toFixed(1)}
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

    } catch (error) {
        logToConsole(`Error cargando materias: ${error.message}`, 'error');
    }
}

async function handleSubjectSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('subject-nombre').value.trim();
    const creditos = parseInt(document.getElementById('subject-creditos').value);

    // Validaciones
    if (!nombre) {
        alert('El nombre de la materia es obligatorio');
        return;
    }

    if (!creditos || creditos < 1 || creditos > 10) {
        alert('Los créditos deben estar entre 1 y 10');
        return;
    }

    // Verificar si la materia ya existe
    const materiaExistente = allSubjects.find(s => s.nombre.toLowerCase() === nombre.toLowerCase());
    if (materiaExistente) {
        alert(`La materia "${nombre}" ya existe en el sistema.\n\nPor favor, usa un nombre diferente.`);
        return;
    }

    try {
        await window.electronAPI.createSubject(nombre, creditos);
        console.log(`Materia creada: ${nombre} (${creditos} creditos)`);

        document.getElementById('subject-form').reset();
        await loadSubjects();
        await loadReports();

        // Mostrar mensaje de éxito
        alert(`Materia "${nombre}" creada exitosamente con ${creditos} créditos.`);

    } catch (error) {
        console.error(`Error: ${error.message}`);

        // Manejar error de duplicado
        if (error.message.includes('Duplicate entry') || error.message.includes('ER_DUP_ENTRY')) {
            alert(`Error: La materia "${nombre}" ya existe en la base de datos.\n\nPor favor, usa un nombre diferente.`);
        } else {
            alert(`Error al crear la materia: ${error.message}`);
        }
    }
}

async function deleteSubject(id, nombre) {
    if (!confirm(`Eliminar materia "${nombre}" y todas sus calificaciones asociadas?`)) return;

    try {
        await window.electronAPI.deleteSubject(id);
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
        const grades = await window.electronAPI.getAllGrades();

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
                    <span class="badge bg-${grade.calificacion >= 80 ? 'success' : grade.calificacion >= 70 ? 'warning' : 'danger'} fs-6">
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
    const calificacionStr = document.getElementById('grade-calificacion').value.trim();
    const periodo = document.getElementById('grade-periodo').value;

    // Validaciones
    if (!studentId || !subjectId) {
        alert('Por favor selecciona un estudiante y una materia');
        return;
    }

    if (!calificacionStr) {
        alert('La calificación es obligatoria');
        return;
    }

    // Validar que sea un número válido
    const calificacion = parseFloat(calificacionStr);
    if (isNaN(calificacion)) {
        alert('La calificación debe ser un número válido.\n\nEjemplos válidos: 85, 90.5, 70');
        return;
    }

    // Validar rango 0-100
    if (calificacion < 0 || calificacion > 100) {
        alert('La calificación debe estar entre 0 y 100');
        return;
    }

    try {
        if (editingGradeId) {
            await window.electronAPI.updateGrade(editingGradeId, calificacion);
            logToConsole(`Calificacion actualizada: ${calificacion}`, 'success');
            cancelGradeEdit();
        } else {
            await window.electronAPI.createGrade(studentId, subjectId, calificacion, periodo);
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
    const newGrade = prompt('Nueva calificacion (0-100):');
    if (newGrade === null) return;

    const grade = parseFloat(newGrade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
        alert('Calificación inválida. Debe estar entre 0 y 100.');
        return;
    }

    editingGradeId = id;
    updateGrade(id, grade);
}

async function updateGrade(id, calificacion) {
    try {
        await window.electronAPI.updateGrade(id, calificacion);
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
        await window.electronAPI.deleteGrade(id);
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
        const studentReport = await window.electronAPI.getStudentReport();
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
                        <span class="badge ${student.promedio_general >= 80 ? 'bg-success' : student.promedio_general >= 70 ? 'bg-warning' : 'bg-danger'}">
                            ${parseFloat(student.promedio_general).toFixed(1)}
                        </span>
                    </td>
                    <td class="text-success"><strong>${student.materias_aprobadas}</strong></td>
                    <td class="text-danger"><strong>${student.materias_reprobadas}</strong></td>
                `;
                studentsBody.appendChild(row);
            });
        }

        // Estadisticas de materias
        const subjectStats = await window.electronAPI.getSubjectStatistics();
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
                        <span class="badge ${subject.promedio_materia >= 80 ? 'bg-success' : subject.promedio_materia >= 70 ? 'bg-warning' : 'bg-danger'}">
                            ${parseFloat(subject.promedio_materia).toFixed(1)}
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
        const auditLog = await window.electronAPI.getAuditLog(50);
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

// ==================== TOAST NOTIFICATIONS ====================
function showSuccessToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    const iconMap = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    toast.innerHTML = `
        <i class="bi ${iconMap[type]}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Exponer funciones globales para botones HTML
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.deleteSubject = deleteSubject;
window.editGrade = editGrade;
window.deleteGrade = deleteGrade;
