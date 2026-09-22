// storage.js — wrapper mínimo sobre localStorage, mismo patrón que
// lib/storage.ts en cima-fix-research (createStorageKey + JSON get/set),
// para no reinventar el patrón en este prototipo.

const PREFIX = "cima-fix";

function createStorageKey(entity) {
  return `${PREFIX}:${entity}`;
}

function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Datos semilla (equivalente en memoria a las filas de schema.sql,
// ya que este prototipo no corre una BD real).
const CATEGORIAS = ["Mobiliario", "Eléctrico", "Limpieza", "Tecnología", "Otro"];

const SALONES = [
  { id: 1, edificio: "FIAD", numero: 101 },
  { id: 2, edificio: "FIAD", numero: 204 },
];

function findSalon(id) {
  return SALONES.find((s) => String(s.id) === String(id));
}

function nextId(list) {
  return list.length ? Math.max(...list.map((r) => r.id)) + 1 : 1;
}
