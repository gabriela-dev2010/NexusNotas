DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS materias;

CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    colegio TEXT NOT NULL,
    nota_min REAL NOT NULL DEFAULT 1.0,
    nota_max REAL NOT NULL DEFAULT 5.0,
    nota_aprob REAL NOT NULL DEFAULT 3.0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    nota_final REAL,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id) ON DELETE CASCADE
);