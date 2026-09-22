-- Cima Fix -- database schema
-- Fase 1 (Aidan): Usuario, Reporte, Salon, Categoria
-- Fields added by Kevin to support the "Reportar incidencia" task flow (Carlos, Fase 2):
--   Reporte.estado, Reporte.urgencia, Reporte.fecha_creacion
-- Pending confirmation with Aidan for the official ERD version.

CREATE TABLE Usuario (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre                TEXT NOT NULL,
    correo_institucional  TEXT NOT NULL UNIQUE,
    rol                   TEXT NOT NULL CHECK (rol IN ('estudiante', 'docente', 'administrador', 'tecnico'))
);

CREATE TABLE Categoria (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE Salon (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    edificio TEXT NOT NULL,
    numero   INTEGER NOT NULL,
    horario  TEXT
);

CREATE TABLE Reporte (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id        INTEGER NOT NULL REFERENCES Salon(id),
    categoria_id    INTEGER NOT NULL REFERENCES Categoria(id),
    usuario_id      INTEGER NOT NULL REFERENCES Usuario(id),  -- who reported it
    tecnico_id      INTEGER REFERENCES Usuario(id),           -- who's handling it, null until assigned
    descripcion     TEXT NOT NULL,
    estado          TEXT NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_progreso', 'resuelto')),
    urgencia        TEXT NOT NULL CHECK (urgencia IN ('leve', 'moderado', 'urgente')),
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes: support the Atender queries (by estado) and Supervisar queries (by salon / age)
CREATE INDEX idx_reporte_estado ON Reporte(estado);
CREATE INDEX idx_reporte_salon  ON Reporte(salon_id);
CREATE INDEX idx_reporte_fecha  ON Reporte(fecha_creacion);

-- Minimal seed data so the prototype can be navigated without capturing everything by hand
INSERT INTO Usuario (nombre, correo_institucional, rol) VALUES
    ('Jonatan Crespo Ragland', 'jcrespo@uabc.edu.mx', 'docente'),
    ('Alfonso Ibarra Collins', 'aibarra@uabc.edu.mx', 'administrador');

INSERT INTO Categoria (nombre) VALUES
    ('Mobiliario'), ('Eléctrico'), ('Limpieza'), ('Tecnología'), ('Otro');

INSERT INTO Salon (edificio, numero, horario) VALUES
    ('FIAD', 101, 'Lun-Vie 7:00-21:00'),
    ('FIAD', 204, 'Lun-Vie 7:00-21:00');
