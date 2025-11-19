import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Servir carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Configuración MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "n0m3l0",
  database: "desesperanzaa100",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Conectado a MySQL");
});

// 🔵 OBTENER CATÁLOGO
app.get("/api/panes", (req, res) => {
  const sql = "SELECT id, nombre, precio, cantidad, descripcion, imagen FROM panes";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const data = results.map((pan) => ({
      ...pan,
      imagen: pan.imagen ? pan.imagen.toString("base64") : null,
    }));

    res.json(data);
  });
});

// 🟢 GUARDAR PAN
app.post("/api/guardar", (req, res) => {
  if (!req.files || !req.files.imagen) {
    return res.status(400).json({ ok: false, error: "Debes subir una imagen" });
  }

  const { nombre, precio, cantidad, descripcion } = req.body;
  const imagen = req.files.imagen.data;

  const sql =
    "INSERT INTO panes (nombre, precio, cantidad, descripcion, imagen) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [nombre, precio, cantidad, descripcion, imagen], (err) => {
    if (err) return res.status(500).json({ ok: false, error: err });
    res.json({ ok: true, message: "Pan guardado exitosamente" });
  });
});

// 🚀 INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor arriba en http://localhost:${PORT}`);
});
