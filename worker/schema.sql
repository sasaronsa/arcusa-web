-- Esquema de referencia para la base de datos D1 de /visitantes.
-- No se aplica automáticamente: ejecútalo al crear la base de datos D1
-- (ver checklist de despliegue en Cloudflare).

CREATE TABLE pins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  comentario TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  tipo TEXT CHECK(tipo IN ('normal', 'dorado')) DEFAULT 'normal',
  -- País obtenido por geocodificación inversa (best-effort, puede ser NULL).
  pais TEXT,
  pais_code TEXT,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_ip_hash_fecha ON pins(ip_hash, created_at);
