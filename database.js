/**
 * DATABASE.JS - Sistema de Gestión de Calificaciones
 * CRUD Completo + Transacciones + Triggers + ROLLBACK
 */

const mysql = require('mysql2/promise');
const config = require('./config.js');

class CalificacionesDB {
    constructor() {
        this.pool = null;
        this.initializeDatabase();
    }

    // ==================== INICIALIZACIÓN ====================
    async initializeDatabase() {
        try {
            console.log('[INIT] Conectando a MySQL...');

            // Crear pool de conexiones
            this.pool = mysql.createPool({
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            console.log('[SUCCESS] Pool de conexiones creado');

            // Crear base de datos si no existe
            await this.createDatabase();

            // Crear tablas
            await this.createTables();

            // Crear triggers
            await this.createTriggers();

            // Crear vista
            await this.createViews();

            // Insertar datos de prueba
            await this.insertSampleData();

            console.log('[SUCCESS] Base de datos completamente inicializada');
            console.log('='.repeat(60));

        } catch (error) {
            console.error('[ERROR] Error inicializando base de datos:', error);
            throw error;
        }
    }

    async createDatabase() {
        try {
            const connection = await mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password
            });

            await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
            console.log('[SUCCESS] Base de datos verificada/creada');
            await connection.end();

        } catch (error) {
            console.error('[ERROR] Error creando base de datos:', error);
            throw error;
        }
    }

    async createTables() {
        const connection = await this.pool.getConnection();

        try {
            console.log('[INIT] Creando tablas...');

            // Tabla estudiantes
            await connection.query(`
                CREATE TABLE IF NOT EXISTS students (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    nombre VARCHAR(100) NOT NULL,
                    apellido VARCHAR(100) NOT NULL,
                    matricula VARCHAR(20) UNIQUE NOT NULL,
                    email VARCHAR(100),
                    fecha_ingreso DATE DEFAULT (CURRENT_DATE),
                    promedio_general DECIMAL(5,2) DEFAULT 0.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_matricula (matricula),
                    INDEX idx_nombre (nombre, apellido)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('[SUCCESS] Tabla students creada');

            // Tabla materias
            await connection.query(`
                CREATE TABLE IF NOT EXISTS subjects (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    nombre VARCHAR(100) UNIQUE NOT NULL,
                    creditos INT NOT NULL DEFAULT 3,
                    promedio_materia DECIMAL(5,2) DEFAULT 0.00,
                    total_estudiantes INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_nombre (nombre)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('[SUCCESS] Tabla subjects creada');

            // Tabla calificaciones
            await connection.query(`
                CREATE TABLE IF NOT EXISTS grades (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    student_id INT NOT NULL,
                    subject_id INT NOT NULL,
                    calificacion DECIMAL(5,2) NOT NULL,
                    periodo VARCHAR(20) DEFAULT 'Semestre 1',
                    fecha_evaluacion DATE DEFAULT (CURRENT_DATE),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_student_subject_periodo (student_id, subject_id, periodo),
                    CHECK (calificacion >= 0 AND calificacion <= 100),
                    INDEX idx_student (student_id),
                    INDEX idx_subject (subject_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('[SUCCESS] Tabla grades creada');

            // Tabla de auditoría
            await connection.query(`
                CREATE TABLE IF NOT EXISTS grade_audit_log (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    action VARCHAR(20) NOT NULL,
                    table_name VARCHAR(50) NOT NULL,
                    record_id INT,
                    old_value TEXT,
                    new_value TEXT,
                    usuario VARCHAR(100) DEFAULT 'sistema',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_timestamp (timestamp),
                    INDEX idx_action (action)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('[SUCCESS] Tabla grade_audit_log creada');

        } finally {
            connection.release();
        }
    }

    async createTriggers() {
        const connection = await this.pool.getConnection();

        try {
            console.log('[INIT] Creando triggers...');

            // Eliminar triggers existentes
            await connection.query('DROP TRIGGER IF EXISTS trg_validate_grade_before_insert');
            await connection.query('DROP TRIGGER IF EXISTS trg_update_student_avg_after_insert');
            await connection.query('DROP TRIGGER IF EXISTS trg_update_student_avg_after_update');
            await connection.query('DROP TRIGGER IF EXISTS trg_update_subject_stats_after_insert');
            await connection.query('DROP TRIGGER IF EXISTS trg_audit_delete_grade');

            // TRIGGER 1: Validar calificación
            await connection.query(`
                CREATE TRIGGER trg_validate_grade_before_insert
                BEFORE INSERT ON grades
                FOR EACH ROW
                BEGIN
                    IF NEW.calificacion < 0 OR NEW.calificacion > 100 THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'Calificación debe estar entre 0 y 100';
                    END IF;
                END
            `);
            console.log('[SUCCESS] Trigger: trg_validate_grade_before_insert');

            // TRIGGER 2: Actualizar promedio estudiante (INSERT)
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

                    INSERT INTO grade_audit_log (action, table_name, record_id, new_value)
                    VALUES ('INSERT', 'grades', NEW.id,
                            CONCAT(
                                'Estudiante: ', (SELECT CONCAT(nombre, ' ', apellido) FROM students WHERE id = NEW.student_id),
                                ' | Materia: ', (SELECT nombre FROM subjects WHERE id = NEW.subject_id),
                                ' | Calificación: ', NEW.calificacion
                            ));
                END
            `);
            console.log('[SUCCESS] Trigger: trg_update_student_avg_after_insert');

            // TRIGGER 3: Actualizar promedio estudiante (UPDATE)
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
            console.log('[SUCCESS] Trigger: trg_update_student_avg_after_update');

            // TRIGGER 4: Actualizar estadísticas materia
            await connection.query(`
                CREATE TRIGGER trg_update_subject_stats_after_insert
                AFTER INSERT ON grades
                FOR EACH ROW
                BEGIN
                    UPDATE subjects
                    SET promedio_materia = (
                        SELECT COALESCE(AVG(calificacion), 0)
                        FROM grades
                        WHERE subject_id = NEW.subject_id
                    ),
                    total_estudiantes = (
                        SELECT COUNT(DISTINCT student_id)
                        FROM grades
                        WHERE subject_id = NEW.subject_id
                    )
                    WHERE id = NEW.subject_id;
                END
            `);
            console.log('[SUCCESS] Trigger: trg_update_subject_stats_after_insert');

            // TRIGGER 5: Auditoría DELETE
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
            console.log('[SUCCESS] Trigger: trg_audit_delete_grade');

        } finally {
            connection.release();
        }
    }

    async createViews() {
        const connection = await this.pool.getConnection();

        try {
            console.log('[INIT] Creando vistas...');

            await connection.query('DROP VIEW IF EXISTS student_report');
            await connection.query(`
                CREATE VIEW student_report AS
                SELECT
                    s.id,
                    s.nombre,
                    s.apellido,
                    s.matricula,
                    s.promedio_general,
                    COUNT(g.id) as total_materias,
                    SUM(CASE WHEN g.calificacion >= 70 THEN 1 ELSE 0 END) as materias_aprobadas,
                    SUM(CASE WHEN g.calificacion < 70 THEN 1 ELSE 0 END) as materias_reprobadas
                FROM students s
                LEFT JOIN grades g ON s.id = g.student_id
                GROUP BY s.id, s.nombre, s.apellido, s.matricula, s.promedio_general
            `);
            console.log('[SUCCESS] Vista: student_report creada');

        } finally {
            connection.release();
        }
    }

    async insertSampleData() {
        // Datos de ejemplo deshabilitados - La aplicación inicia vacía
        console.log('[INFO] Base de datos lista (sin datos de ejemplo)');
        return;

        /* DESCOMENTADO PARA INSERTAR DATOS DE EJEMPLO:
        const connection = await this.pool.getConnection();

        try {
            // Verificar si ya hay datos
            const [students] = await connection.query('SELECT COUNT(*) as count FROM students');
            if (students[0].count > 0) {
                console.log('[INFO] Datos de ejemplo ya existen');
                return;
            }

            console.log('[INFO] Insertando datos de ejemplo...');

            // Insertar materias
            await connection.query(`
                INSERT INTO subjects (nombre, creditos) VALUES
                ('Matemáticas', 5),
                ('Programación', 6),
                ('Bases de Datos', 5),
                ('Inglés', 4)
            `);

            // Insertar estudiantes
            await connection.query(`
                INSERT INTO students (nombre, apellido, matricula, email) VALUES
                ('Juan', 'Pérez', '2024001', 'juan.perez@ejemplo.com'),
                ('María', 'González', '2024002', 'maria.gonzalez@ejemplo.com'),
                ('Carlos', 'Rodríguez', '2024003', 'carlos.rodriguez@ejemplo.com')
            `);

            console.log('[SUCCESS] Datos de ejemplo insertados');

        } catch (error) {
            console.error('[ERROR] Error insertando datos de ejemplo:', error);
        } finally {
            connection.release();
        }
        */
    }

    // ==================== CRUD ESTUDIANTES ====================
    
    async createStudent(nombre, apellido, matricula, email) {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.query(
                'INSERT INTO students (nombre, apellido, matricula, email) VALUES (?, ?, ?, ?)',
                [nombre, apellido, matricula, email]
            );
            console.log(`[SUCCESS] Estudiante creado: ${nombre} ${apellido} (ID: ${result.insertId})`);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    async getAllStudents() {
        const [rows] = await this.pool.query(`
            SELECT s.*,
                   COUNT(g.id) as total_calificaciones,
                   COALESCE(SUM(CASE WHEN g.calificacion >= 70 THEN 1 ELSE 0 END), 0) as materias_aprobadas
            FROM students s
            LEFT JOIN grades g ON s.id = g.student_id
            GROUP BY s.id
            ORDER BY s.apellido, s.nombre
        `);
        return rows;
    }

    async updateStudent(id, nombre, apellido, email) {
        const connection = await this.pool.getConnection();
        try {
            await connection.query(
                'UPDATE students SET nombre = ?, apellido = ?, email = ? WHERE id = ?',
                [nombre, apellido, email, id]
            );
            console.log(`[SUCCESS] Estudiante actualizado: ID ${id}`);
        } finally {
            connection.release();
        }
    }

    async deleteStudent(id) {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('DELETE FROM students WHERE id = ?', [id]);
            console.log(`[SUCCESS] Estudiante eliminado: ID ${id}`);
        } finally {
            connection.release();
        }
    }

    // ==================== CRUD MATERIAS ====================
    
    async createSubject(nombre, creditos) {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.query(
                'INSERT INTO subjects (nombre, creditos) VALUES (?, ?)',
                [nombre, creditos]
            );
            console.log(`[SUCCESS] Materia creada: ${nombre} (ID: ${result.insertId})`);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    async getAllSubjects() {
        const [rows] = await this.pool.query(`
            SELECT * FROM subjects ORDER BY nombre
        `);
        return rows;
    }

    async deleteSubject(id) {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('DELETE FROM subjects WHERE id = ?', [id]);
            console.log(`[SUCCESS] Materia eliminada: ID ${id}`);
        } finally {
            connection.release();
        }
    }

    // ==================== CRUD CALIFICACIONES ====================
    
    async createGrade(studentId, subjectId, calificacion, periodo = 'Semestre 1') {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.query(
                'INSERT INTO grades (student_id, subject_id, calificacion, periodo) VALUES (?, ?, ?, ?)',
                [studentId, subjectId, calificacion, periodo]
            );
            console.log(`[SUCCESS] Calificación registrada: Estudiante ${studentId}, Materia ${subjectId}, Nota: ${calificacion}`);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    async getAllGrades() {
        const [rows] = await this.pool.query(`
            SELECT 
                g.*,
                CONCAT(s.nombre, ' ', s.apellido) as student_name,
                s.matricula,
                sub.nombre as subject_name,
                CASE
                    WHEN g.calificacion >= 70 THEN 'Aprobado'
                    ELSE 'Reprobado'
                END as status
            FROM grades g
            JOIN students s ON g.student_id = s.id
            JOIN subjects sub ON g.subject_id = sub.id
            ORDER BY g.created_at DESC
        `);
        return rows;
    }

    async updateGrade(id, calificacion) {
        const connection = await this.pool.getConnection();
        try {
            await connection.query(
                'UPDATE grades SET calificacion = ? WHERE id = ?',
                [calificacion, id]
            );
            console.log(`[SUCCESS] Calificación actualizada: ID ${id}, Nueva nota: ${calificacion}`);
        } finally {
            connection.release();
        }
    }

    async deleteGrade(id) {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('DELETE FROM grades WHERE id = ?', [id]);
            console.log(`[SUCCESS] Calificación eliminada: ID ${id}`);
        } finally {
            connection.release();
        }
    }

    // ==================== AUDITORÍA ====================
    
    async getAuditLog(limit = 50) {
        const [rows] = await this.pool.query(`
            SELECT * FROM grade_audit_log 
            ORDER BY timestamp DESC 
            LIMIT ?
        `, [limit]);
        return rows;
    }

    // ==================== TRANSACCIONES Y ROLLBACK ====================
    
    async enrollStudentWithTransaction(studentId, subjectIds, grades) {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();
            console.log('[TRANSACTION] START - Inscribiendo estudiante en múltiples materias');

            for (let i = 0; i < subjectIds.length; i++) {
                const subjectId = subjectIds[i];
                const grade = grades[i];

                console.log(`[TRANSACTION]   INSERT INTO grades: Estudiante ${studentId}, Materia ${subjectId}, Nota ${grade}`);

                await connection.query(
                    'INSERT INTO grades (student_id, subject_id, calificacion) VALUES (?, ?, ?)',
                    [studentId, subjectId, grade]
                );
            }

            await connection.commit();
            console.log('[TRANSACTION] COMMIT - Transacción completada exitosamente');
            return true;

        } catch (error) {
            await connection.rollback();
            console.log('[TRANSACTION] ROLLBACK - Error en transacción, todos los cambios revertidos');
            console.error('[ERROR]', error.message);
            throw error;

        } finally {
            connection.release();
        }
    }

    async deleteStudentWithGradesTransaction(studentId) {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();
            console.log(`[TRANSACTION] START - Eliminando estudiante ${studentId} y todas sus calificaciones`);

            const [grades] = await connection.query('SELECT COUNT(*) as count FROM grades WHERE student_id = ?', [studentId]);
            console.log(`[TRANSACTION]   Calificaciones a eliminar: ${grades[0].count}`);

            await connection.query('DELETE FROM grades WHERE student_id = ?', [studentId]);
            console.log(`[TRANSACTION]   DELETE FROM grades WHERE student_id = ${studentId}`);

            await connection.query('DELETE FROM students WHERE id = ?', [studentId]);
            console.log(`[TRANSACTION]   DELETE FROM students WHERE id = ${studentId}`);

            await connection.commit();
            console.log('[TRANSACTION] COMMIT - Estudiante y calificaciones eliminados');
            return true;

        } catch (error) {
            await connection.rollback();
            console.log('[TRANSACTION] ROLLBACK - Error, ningún dato fue eliminado');
            throw error;

        } finally {
            connection.release();
        }
    }

    // ==================== REPORTES ====================
    
    async getStudentReport() {
        const [rows] = await this.pool.query('SELECT * FROM student_report ORDER BY promedio_general DESC');
        return rows;
    }

    async getSubjectStatistics() {
        const [rows] = await this.pool.query(`
            SELECT
                s.nombre,
                s.creditos,
                s.promedio_materia,
                s.total_estudiantes,
                COUNT(g.id) as total_calificaciones,
                SUM(CASE WHEN g.calificacion >= 70 THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN g.calificacion < 70 THEN 1 ELSE 0 END) as reprobados
            FROM subjects s
            LEFT JOIN grades g ON s.id = g.subject_id
            GROUP BY s.id
            ORDER BY s.nombre
        `);
        return rows;
    }
}

module.exports = CalificacionesDB;