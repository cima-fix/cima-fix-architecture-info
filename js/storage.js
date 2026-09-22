// storage.js -- minimal localStorage wrapper, same pattern as
// lib/storage.ts in cima-fix-research (createStorageKey + JSON get/set),
// so we don't reinvent the pattern in this prototype.

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

// Seed data (in-memory equivalent of the rows in schema.sql,
// since this prototype doesn't run a real database).
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
