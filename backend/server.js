require("dotenv").config({ path: ".env" });
const express = require("express");
const mysql = require("mysql2/promise"); // Cambiado a promise
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const twilio = require('twilio');
const os = require('os');

// Configuración de Twilio con validación
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error("❌ Faltan credenciales de Twilio en .env");
  process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const app = express();

// Configuración CORS actualizada
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:3000',
    'http://192.168.56.1:8081',// No mover
    'http://10.19.100.158:8081',
    'http://10.19.100.158:3000',
    'exp://10.19.100.158:8081'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Configuración de la base de datos MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "12345",
  database: process.env.DB_NAME || "tacofish",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión a la base de datos
db.getConnection()
  .then((connection) => {
    console.log("✅ Conectado a la base de datos MySQL");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Error al conectar a la base de datos:", err.message);
    process.exit(1);
  });

const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";
const verificationCodes = {};

// Función para formatear teléfono
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) {
    throw new Error("El número de teléfono debe tener 10 dígitos");
  }
  return `+52${cleaned}`;
};

// Ruta de registro corregida
app.post("/registro", async (req, res) => {
  try {
    const { nombre, telefono, contraseña, confirmarContraseña } = req.body;

    // Validaciones básicas
    if (!nombre || !telefono || !contraseña || !confirmarContraseña) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (contraseña !== confirmarContraseña) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    const formattedTelefono = formatPhoneNumber(telefono);

    // Verificar si el usuario ya existe
    const [usuarioExistente] = await db.query(
      "SELECT id FROM usuarios WHERE telefono = ?",
      [formattedTelefono]
    );

    if (usuarioExistente.length > 0) {
      return res.status(400).json({ 
        error: "Este número de teléfono ya está registrado" 
      });
    }

    // Generar código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Enviar SMS con Twilio
    try {
      await client.messages.create({
        body: `Tu código de verificación es: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedTelefono
      });
    } catch (twilioError) {
      console.error("Error de Twilio:", twilioError);
      return res.status(500).json({
        error: "Error al enviar SMS",
        details: twilioError.code === 21211 ? "Número inválido" : "Intenta más tarde"
      });
    }

    // Guardar datos para verificación
    verificationCodes[formattedTelefono] = {
      code: verificationCode,
      userData: { nombre, contraseña },
      timestamp: Date.now()
    };

    res.status(200).json({ 
      message: "Código de verificación enviado", 
      telefono: formattedTelefono 
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error.message 
    });
  }
});

// Ruta de verificación corregida
app.post("/verificar-codigo", async (req, res) => {
  try {
    const { telefono, codigo } = req.body;

    if (!telefono || !codigo) {
      return res.status(400).json({ error: "Teléfono y código son requeridos" });
    }

    const storedData = verificationCodes[telefono];
    
    if (!storedData || storedData.code !== codigo) {
      return res.status(400).json({ error: "Código de verificación inválido" });
    }

    // Verificar expiración (5 minutos)
    if (Date.now() - storedData.timestamp > 300000) {
      delete verificationCodes[telefono];
      return res.status(400).json({ error: "Código expirado" });
    }

    // Hashear contraseña y crear usuario
    const hashedPassword = await bcrypt.hash(storedData.userData.contraseña, 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, telefono, contraseña) VALUES (?, ?, ?)",
      [storedData.userData.nombre, telefono, hashedPassword]
    );

    // Generar token JWT
    const token = jwt.sign(
      { id: result.insertId, telefono },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    delete verificationCodes[telefono];

    res.status(201).json({ 
      message: "Usuario registrado exitosamente",
      token,
      usuario: {
        id: result.insertId,
        nombre: storedData.userData.nombre,
        telefono
      }
    });

  } catch (error) {
    console.error("Error en verificación:", error);
    res.status(500).json({ 
      error: "Error al completar el registro",
      details: error.message 
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { telefono, contraseña } = req.body;

    console.log("Datos recibidos en /login:", { telefono, contraseña });

    // Validación de campos faltantes
    if (!telefono && !contraseña) {
      return res.status(400).json({ error: "Teléfono y contraseña son requeridos" });
    }
    if (!telefono) {
      return res.status(400).json({ error: "Teléfono es requerido" });
    }
    if (!contraseña) {
      return res.status(400).json({ error: "Contraseña es requerida" });
    }

    // Validación de formato de teléfono
    const cleanedTelefono = telefono.replace(/\D/g, "");
    if (cleanedTelefono.length !== 10) {
      return res.status(400).json({ error: "El teléfono debe tener 10 dígitos" });
    }

    const formattedTelefono = `+52${cleanedTelefono}`;
    console.log("Teléfono formateado:", formattedTelefono);

    // Buscar usuario en la base de datos
    const [users] = await db.query(
      "SELECT * FROM usuarios WHERE telefono = ?",
      [formattedTelefono]
    );

    console.log("Resultado de la consulta a la base de datos:", users);

    if (users.length === 0) {
      return res.status(404).json({ error: "El teléfono no está registrado" });
    }

    const usuario = users[0];
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    console.log("Contraseña válida:", contraseñaValida);

    if (!contraseñaValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        telefono: usuario.telefono,
        tipo_usuario: usuario.tipo_usuario,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    console.log("Token generado:", token);

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        tipo_usuario: usuario.tipo_usuario,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para verificar token
app.get("/verify-token", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const [users] = await db.query(
      "SELECT id, nombre, telefono, tipo_usuario FROM usuarios WHERE id = ?",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Token válido",
      usuario: users[0]
    });

  } catch (error) {
    console.error("Error en verify-token:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
app.get("/categorias", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nombre, imagen
      FROM categoria
    `);

    const categoriasConImagen = rows.map((categoria) => {
      let imagenBase64 = null;
      if (categoria.imagen && categoria.imagen instanceof Buffer) {
        imagenBase64 = categoria.imagen.toString('base64');
      }

      return {
        ...categoria,
        imagen: imagenBase64, // Imagen convertida a base64
      };
    });

    res.json(categoriasConImagen);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

app.get('/categorias/:id/platillos', async (req, res) => {
  try {
    const [platillos] = await db.query(`
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM platillo p
      JOIN categoria c ON p.categoria_id = c.id
      WHERE p.categoria_id = ?
    `, [req.params.id]);

    const platillosFormateados = platillos.map(platillo => {
      // Convertir el BLOB a base64
      let imagenBase64 = null;
      if (platillo.imagen && platillo.imagen instanceof Buffer) {
        imagenBase64 = platillo.imagen.toString('base64');
      }

      return {
        id: platillo.id,
        nombre: platillo.nombre,
        descripcion: platillo.descripcion,
        precio: platillo.precio,
        imagen: imagenBase64, // Enviar como base64
        categoria: {
          id: platillo.categoria_id,
          nombre: platillo.categoria_nombre
        }
      };
    });

    res.json(platillosFormateados);
  } catch (error) {
    console.error('Error al obtener platillos por categoría:', error);
    res.status(500).json({ 
      error: 'Error al obtener platillos por categoría',
      detalle: error.message 
    });
  }
});

app.get("/platillos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, 
             c.nombre AS categoria
      FROM platillo p
      JOIN categoria c ON p.categoria_id = c.id
    `);

    const platillosConImagen = rows.map((platillo) => {
      // Convertir el BLOB a base64
      let imagenBase64 = null;
      if (platillo.imagen && platillo.imagen instanceof Buffer) {
        imagenBase64 = platillo.imagen.toString('base64');
      }

      return {
        ...platillo,
        imagen: imagenBase64, // Enviar como base64
      };
    });

    res.json(platillosConImagen);
  } catch (error) {
    console.error("Error al obtener platillos:", error);
    res.status(500).json({ error: "Error al obtener platillos" });
  }
});
//Carrusel 
app.get('/api/platillos-destacados', async (req, res) => {
  let connection;
  try {
    // 1. Obtener conexión de la pool
    connection = await db.getConnection();
    
    // 2. Consulta optimizada para obtener platillos con calificaciones
    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.imagen,
        p.descripcion,
        c.nombre AS categoria,
        IFNULL(ROUND(AVG(cp.calificacion), 1), 0) AS calificacion_promedio,
        COUNT(cp.id) AS total_calificaciones,
        GROUP_CONCAT(DISTINCT cp.comentario SEPARATOR '|||') AS comentarios
      FROM 
        platillo p
      JOIN 
        categoria c ON p.categoria_id = c.id
      LEFT JOIN 
        calificaciones_platillos cp ON p.id = cp.platillo_id
      WHERE
        p.id IN (
          SELECT platillo_id 
          FROM calificaciones_platillos 
          GROUP BY platillo_id 
          ORDER BY AVG(calificacion) DESC 
          LIMIT 10
        )
        OR p.id IN (
          SELECT id 
          FROM platillo 
          ORDER BY RAND() 
          LIMIT 10
        )
      GROUP BY 
        p.id
      ORDER BY 
        calificacion_promedio DESC,
        total_calificaciones DESC
      LIMIT 10
    `;

    const [rows] = await connection.query(query);

    // 3. Procesar resultados
    const platillos = rows.map(platillo => {
      // Procesar comentarios para eliminar duplicados
      const comentariosUnicos = [...new Set(
        (platillo.comentarios || '').split('|||').filter(c => c && c.trim() !== '')
      )];
      
      return {
        id: platillo.id.toString(),
        nombre: platillo.nombre,
        imagen: platillo.imagen 
        ? `data:image/jpeg;base64,${platillo.imagen.toString('base64')}` 
        : null,
        descripcion: platillo.descripcion || '',
        categoria: platillo.categoria,
        calificacion: Number(platillo.calificacion_promedio),
        total_calificaciones: Number(platillo.total_calificaciones),
        comentarios: comentariosUnicos.slice(0, 3) // Mostrar máximo 3 comentarios
      };
    });

    // 4. Si no hay resultados, devolver platillos aleatorios
    if (platillos.length === 0) {
      const [platillosAleatorios] = await connection.query(`
        SELECT 
          p.id,
          p.nombre,
          p.imagen,
          p.descripcion,
          cat.nombre AS categoria
        FROM 
          platillo p
        JOIN 
          categoria cat ON p.categoria_id = cat.id
        ORDER BY RAND()
        LIMIT 10
      `);
      
      const resultado = platillosAleatorios.map(p => ({
        id: p.id.toString(),
        nombre: p.nombre,
        imagen: p.imagen 
        ? `data:image/jpeg;base64,${p.imagen.toString('base64')}` 
        : null,

        descripcion: p.descripcion || '',
        categoria: p.categoria,
        calificacion: 0,
        total_calificaciones: 0,
        comentarios: []
      }));
      
      return res.json({
        success: true,
        data: resultado,
        message: 'Platillos aleatorios (no hay calificaciones aún)'
      });
    }

    res.json({
      success: true,
      data: platillos,
      message: 'Platillos destacados obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error en /api/platillos-destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener platillos destacados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // 5. Liberar conexión siempre
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error liberando conexión:', releaseError);
      }
    }
  }
});
// Endpoint para obtener calificaciones
app.get('/platillos/:id/calificaciones', async (req, res) => {
  try {
    const platilloId = req.params.id;

    const [calificaciones] = await db.query(`
      SELECT 
        cp.*,
        u.nombre as usuario_nombre,
        DATE_FORMAT(cp.fecha_calificacion, '%Y-%m-%d %H:%i') as fecha_formateada
      FROM calificaciones_platillos cp
      JOIN usuarios u ON cp.usuario_id = u.id
      WHERE cp.platillo_id = ?
      ORDER BY cp.fecha_calificacion DESC
    `, [platilloId]);

    const [stats] = await db.query(`
      SELECT 
        AVG(calificacion) as promedio,
        COUNT(*) as total
      FROM calificaciones_platillos
      WHERE platillo_id = ?
    `, [platilloId]);

    res.json({
      calificaciones,
      promedio: parseFloat(stats[0].promedio || 0).toFixed(1),
      total: stats[0].total
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// Endpoint para borrar calificación
app.delete('/calificaciones/:id', async (req, res) => {
  try {
    const calificacionId = req.params.id;
    const usuarioId = req.body.usuario_id; // Requiere autenticación

    // Verificar que la calificación pertenece al usuario
    const [calificacion] = await pool.query(`
      SELECT id FROM calificaciones_platillos 
      WHERE id = ? AND usuario_id = ?
    `, [calificacionId, usuarioId]);

    if (calificacion.length === 0) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const [result] = await pool.query(`
      DELETE FROM calificaciones_platillos 
      WHERE id = ?
    `, [calificacionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al borrar calificación' });
  }
});



app.get('/platillos/:id/calificaciones', async (req, res) => {
  try {
    const platilloId = req.params.id;
    
    // Verificar si el platillo existe
    const [platillo] = await db.query('SELECT id FROM platillo WHERE id = ?', [platilloId]);
    
    if (platillo.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Platillo no encontrado' 
      });
    }

    // Obtener calificaciones con información del usuario
    const [calificaciones] = await pool.query(`
      SELECT 
        cp.id,
        cp.usuario_id,
        cp.platillo_id,
        cp.calificacion,
        cp.comentario,
        DATE_FORMAT(cp.fecha_calificacion, '%Y-%m-%d %H:%i:%s') as fecha_calificacion,
        u.nombre as usuario_nombre,
        DATE_FORMAT(cp.fecha_calificacion, '%d/%m/%Y') as fecha_formateada
      FROM calificaciones_platillos cp
      JOIN usuarios u ON cp.usuario_id = u.id
      WHERE cp.platillo_id = ?
      ORDER BY cp.fecha_calificacion DESC
    `, [platilloId]);

    // Calcular promedio y total
    const [stats] = await db.query(`
      SELECT 
        AVG(calificacion) as promedio,
        COUNT(*) as total
      FROM calificaciones_platillos
      WHERE platillo_id = ?
    `, [platilloId]);

    res.json({
      success: true,
      calificaciones: calificaciones,
      promedio: stats[0].promedio ? parseFloat(stats[0].promedio).toFixed(1) : "0.0",
      total: stats[0].total || 0
    });

  } catch (error) {
    console.error('Error en GET /platillos/:id/calificaciones:', error);
    console.error('Error detalles:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener calificaciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// 4. Agregar nueva calificación
// En tu servidor backend (app.js o server.js)
// Endpoint para crear calificaciones (versión mejorada)
app.post('/platillos/:id/calificaciones', async (req, res) => {
  const platilloId = req.params.id;
  const { usuario_id, calificacion, comentario } = req.body;
  console.log('Datos recibidos:', { usuario_id, calificacion, platilloId, comentario });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token no proporcionado' 
    });
  }

  // Validación de campos requeridos
  if (!usuario_id || calificacion === undefined || !platilloId) {
    return res.status(400).json({ 
      success: false,
      error: 'Usuario ID, calificación y platillo ID son requeridos' 
    });
  }

  // Validación del formato de la calificación
  const calificacionEntera = Math.round(Number(calificacion));
  if (isNaN(calificacionEntera) || calificacionEntera < 1 || calificacionEntera > 5) {
    return res.status(400).json({ 
      success: false,
      error: 'La calificación debe ser un número entero entre 1 y 5' 
    });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 1. Verificar existencia del platillo
    const [platillo] = await connection.query(
      'SELECT * FROM platillo WHERE id = ?', 
      [platilloId]
    );
    
    if (platillo.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Platillo no encontrado' 
      });
    }

    // 2. Verificar existencia del usuario
    const [usuario] = await connection.query(
      'SELECT id FROM usuarios WHERE id = ?', 
      [usuario_id]
    );
    
    if (usuario.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    // 3. Verificar si ya existe una calificación del usuario para este platillo
    const [existente] = await connection.query(
      'SELECT * FROM calificaciones_platillos WHERE usuario_id = ? AND platillo_id = ?',
      [usuario_id, platilloId]
    );

    if (existente.length > 0) {
      // Actualizar calificación existente
      await connection.query(
        'UPDATE calificaciones_platillos SET calificacion = ?, comentario = ?, fecha_calificacion = CURRENT_TIMESTAMP WHERE usuario_id = ? AND platillo_id = ?',
        [calificacionEntera, comentario || null, usuario_id, platilloId]
      );
    } else {
      // Insertar nueva calificación
      await connection.query(
        'INSERT INTO calificaciones_platillos (usuario_id, platillo_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
        [usuario_id, platilloId, calificacionEntera, comentario || null]
      );
    }

    // 4. Obtener los datos actualizados para la respuesta
    const [calificacionActualizada] = await connection.query(
      `SELECT 
        cp.*, 
        u.nombre as usuario_nombre,
        p.nombre as platillo_nombre,
        DATE_FORMAT(cp.fecha_calificacion, '%d %b %Y') as fecha_formateada
      FROM calificaciones_platillos cp
      JOIN usuarios u ON cp.usuario_id = u.id
      JOIN platillo p ON cp.platillo_id = p.id
      WHERE cp.usuario_id = ? AND cp.platillo_id = ?`,
      [usuario_id, platilloId]
    );

    return res.status(existente.length > 0 ? 200 : 201).json({
      success: true,
      data: calificacionActualizada[0],
      message: existente.length > 0 
        ? 'Calificación actualizada exitosamente' 
        : 'Calificación registrada exitosamente'
    });

  } catch (error) {
    console.error('Error en el servidor:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
      ...(error.errno && { errno: error.errno }),
      ...(error.sqlMessage && { sqlMessage: error.sqlMessage }),
      ...(error.sql && { sql: error.sql })
    });

    // Manejo de errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'No puedes calificar el mismo platillo más de una vez'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({
        success: false,
        error: 'Usuario o platillo no existe'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });

  } finally {
    if (connection) connection.release();
  }
});
// 5. Eliminar calificación
app.delete('/platillos/:platilloId/calificaciones/:usuarioId', async (req, res) => {
  const { platilloId, usuarioId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token no proporcionado'
    });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 1. Verificar existencia de la calificación
    const [calificacion] = await connection.query(
      'SELECT * FROM calificaciones_platillos WHERE platillo_id = ? AND usuario_id = ?',
      [platilloId, usuarioId]
    );

    if (calificacion.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Calificación no encontrada'
      });
    }

    // 2. Eliminar la calificación
    await connection.query(
      'DELETE FROM calificaciones_platillos WHERE platillo_id = ? AND usuario_id = ?',
      [platilloId, usuarioId]
    );

    // 3. Recalcular promedio del platillo
    const [resultado] = await connection.query(
      'SELECT AVG(calificacion) as nuevo_promedio, COUNT(*) as total FROM calificaciones_platillos WHERE platillo_id = ?',
      [platilloId]
    );

    return res.status(200).json({
      success: true,
      data: {
        nuevo_promedio: resultado[0].nuevo_promedio || 0,
        total_calificaciones: resultado[0].total
      },
      message: 'Calificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  } finally {
    if (connection) connection.release();
  }
});
// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  let localIp = '0.0.0.0';
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168')) {
        localIp = iface.address;
      }
    });
  });

// Endpoint para obtener platillos por categoría


  console.log(`
  🚀 Servidor funcionando en:
  - Local:    http://localhost:${PORT}
  - Red:      http://${localIp}:${PORT}
  
  📡 Endpoints:
  - POST /registro
  - POST /verificar-codigo
  - POST /login
  - GET  /verify-token
  `);
});