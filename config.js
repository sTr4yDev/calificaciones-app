/**
 * CONFIG.JS - Configuración de Conexión MySQL
 *
 * ⚠️ IMPORTANTE: Crea un archivo .env con tus credenciales
 * Usa .env.example como referencia
 */

require('dotenv').config();

module.exports = {
  // Host donde corre MySQL (normalmente localhost)
  host: process.env.DB_HOST || 'localhost',

  // Usuario de MySQL (normalmente 'root')
  user: process.env.DB_USER || 'root',

  // Contraseña de MySQL (desde .env)
  password: process.env.DB_PASSWORD || '',

  // Nombre de la base de datos (se creará automáticamente si no existe)
  database: process.env.DB_NAME || 'sistema_calificaciones',

  // Puerto de MySQL (por defecto 3306)
  port: parseInt(process.env.DB_PORT) || 3306,

  // Configuración del pool de conexiones
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Zona horaria (opcional)
  timezone: process.env.DB_TIMEZONE || '-06:00'
};