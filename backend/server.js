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

// Ruta de login corregida
app.post("/login", async (req, res) => {
  try {
    const { telefono, contraseña } = req.body;

    if (!telefono || !contraseña) {
      return res.status(400).json({ error: "Teléfono y contraseña son requeridos" });
    }

    const formattedTelefono = formatPhoneNumber(telefono);

    // Buscar usuario
    const [users] = await db.query(
      "SELECT * FROM usuarios WHERE telefono = ?",
      [formattedTelefono]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = users[0];
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!contraseñaValida) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        telefono: usuario.telefono,
        tipo_usuario: usuario.tipo_usuario || 'cliente'
      },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        tipo_usuario: usuario.tipo_usuario || 'cliente'
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error.message 
    });
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
// Obtener todas las categorías
app.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categoria');
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});
app.get('/categorias/:id', async (req, res) => {
  try {
    const [categoria] = await pool.query('SELECT * FROM categoria WHERE id = ?', [req.params.id]);
    
    if (categoria.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(categoria[0]);
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

// Endpoints para platillos
app.get('/platillos/categoria/:categoriaId', async (req, res) => {
  try {
    const [platillos] = await pool.query(
      'SELECT p.* FROM platillo p WHERE p.categoria_id = ?',
      [req.params.categoriaId]
    );
    
    res.json(platillos);
  } catch (error) {
    console.error('Error al obtener platillos por categoría:', error);
    res.status(500).json({ error: 'Error al obtener platillos' });
  }
});

app.get('/platillos/:id', async (req, res) => {
  try {
    const [platillo] = await pool.query('SELECT * FROM platillo WHERE id = ?', [req.params.id]);
    
    if (platillo.length === 0) {
      return res.status(404).json({ error: 'Platillo no encontrado' });
    }
    
    res.json(platillo[0]);
  } catch (error) {
    console.error('Error al obtener platillo:', error);
    res.status(500).json({ error: 'Error al obtener platillo' });
  }
});

app.post('/platillos', async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria_id } = req.body;
    
    if (!nombre || !precio || !categoria_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO platillo (nombre, descripcion, precio, categoria_id) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, precio, categoria_id]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Platillo creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear platillo:', error);
    res.status(500).json({ error: 'Error al crear platillo' });
  }
});
// Obtener una categoría específica por ID
app.get('/categorias/:id', async (req, res) => {
  try {
    const [categoria] = await db.query('SELECT * FROM categoria WHERE id = ?', [req.params.id]);
    
    if (categoria.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(categoria[0]);
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});
// Obtener todos los platillos con información de categoría
app.get('/platillos', async (req, res) => {
  try {
    const [platillos] = await db.query(`
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM platillo p
      JOIN categoria c ON p.categoria_id = c.id
    `);
    res.json(platillos);
  } catch (error) {
    console.error('Error al obtener platillos:', error);
    res.status(500).json({ error: 'Error al obtener platillos' });
  }
});

// Obtener platillos por categoría
app.get('/categorias/:id/platillos', async (req, res) => {
  try {
    const [platillos] = await db.query(`
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM platillo p
      JOIN categoria c ON p.categoria_id = c.id
      WHERE p.categoria_id = ?
    `, [req.params.id]);
    
    // Formatear la respuesta
    const platillosFormateados = platillos.map(platillo => ({
      id: platillo.id,
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio,
      imagen: platillo.imagen ? `${process.env.BASE_URL}/images/${platillo.imagen}` : null,
      categoria: {
        id: platillo.categoria_id,
        nombre: platillo.categoria_nombre
      }
    }));
    
    res.json(platillosFormateados);
  } catch (error) {
    console.error('Error al obtener platillos por categoría:', error);
    res.status(500).json({ 
      error: 'Error al obtener platillos por categoría',
      detalle: error.message 
    });
  }
});


// Endpoint para obtener platillos por categoría
app.get('/platillos', async (req, res) => {
  const { categoria_id } = req.query;
  
  try {
    let query = 'SELECT * FROM platillo';
    const params = [];
    
    if (categoria_id) {
      query += ' WHERE categoria_id = ?';
      params.push(categoria_id);
    }
    
    const [results] = await connection.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener platillos:', error);
    res.status(500).json({ error: 'Error al obtener platillos' });
  }
});

// Servir imágenes estáticas
app.use('/images', express.static('assets/images'));

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
app.get('/platillos', async (req, res) => {
  const { categoria_id } = req.query;
  
  try {
    let query = 'SELECT * FROM platillo';
    const params = [];
    
    if (categoria_id) {
      query += ' WHERE categoria_id = ?';
      params.push(categoria_id);
    }
    
    const [results] = await connection.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener platillos:', error);
    res.status(500).json({ error: 'Error al obtener platillos' });
  }
});

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