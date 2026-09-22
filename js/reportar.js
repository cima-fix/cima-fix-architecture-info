// reportar.js — task flow "Reportar incidencia" (Carlos, Fase 2) de inicio a fin.
//
// Cubre lo que pide el task flow:
//  - Ruta feliz: salón -> categoría -> detalles+urgencia -> confirmar -> ticket creado
//  - Side door: llega con ?salon=<id> (simula el QR) en vez de elegir manualmente
//  - Errático 1: QR no válido -> no crea ticket, muestra error explícito
//  - Errático 2: abandona a mitad del formulario -> borrador local, se recupera al volver
//  - Errático 3: reporta lo mismo que hace <1 hora -> pregunta antes de duplicar

const REPORTS_KEY = createStorageKey("reportes");
const DRAFT_KEY = createStorageKey("reportes:borrador");
const DEMO_USER_ID = 1; // usuario "logueado" simulado para este prototipo

const form = document.getElementById("report-form");
const qrError = document.getElementById("qr-error");
const salonSelect = document.getElementById("salon");
const categoriaSelect = document.getElementById("categoria");
const descripcionInput = document.getElementById("descripcion");
const urgenciaSelect = document.getElementById("urgencia");

function init() {
  const params = new URLSearchParams(window.location.search);
  const qrSalon = params.get("salon");

  // Errático: QR no válido / salón no registrado -> no se crea ticket
  if (qrSalon && !findSalon(qrSalon)) {
    qrError.style.display = "block";
    return;
  }

  form.style.display = "block";
  populateSelects();

  if (qrSalon) {
    salonSelect.value = qrSalon;
    salonSelect.disabled = true; // vino del QR, no se elige a mano
  }

  restoreDraftIfAny();
  [salonSelect, categoriaSelect, descripcionInput, urgenciaSelect].forEach((el) =>
    el.addEventListener("input", saveDraft),
  );
}

function populateSelects() {
  salonSelect.innerHTML = SALONES.map(
    (s) => `<option value="${s.id}">${s.edificio} ${s.numero}</option>`,
  ).join("");
  categoriaSelect.innerHTML = CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join("");
}

// Errático: abandono a mitad de formulario -> borrador local
function saveDraft() {
  setItem(DRAFT_KEY, {
    salon: salonSelect.value,
    categoria: categoriaSelect.value,
    descripcion: descripcionInput.value,
    urgencia: urgenciaSelect.value,
  });
}

function restoreDraftIfAny() {
  const draft = getItem(DRAFT_KEY, null);
  if (!draft) return;
  const hasContent = draft.descripcion && draft.descripcion.trim().length > 0;
  if (!hasContent) return;

  const resume = confirm("Tienes un reporte sin terminar. ¿Quieres continuarlo?");
  if (resume) {
    salonSelect.value = draft.salon || salonSelect.value;
    categoriaSelect.value = draft.categoria || categoriaSelect.value;
    descripcionInput.value = draft.descripcion || "";
    urgenciaSelect.value = draft.urgencia || "moderado";
  } else {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function goToStep(n) {
  if (n === 3) renderReview();
  document.querySelectorAll(".step").forEach((s) => {
    s.classList.toggle("active", Number(s.dataset.step) === n);
  });
}

function renderReview() {
  const salon = findSalon(salonSelect.value);
  document.getElementById("review").innerHTML = `
    <p><strong>Salón:</strong> ${salon.edificio} ${salon.numero}</p>
    <p><strong>Categoría:</strong> ${categoriaSelect.value}</p>
    <p><strong>Descripción:</strong> ${descripcionInput.value}</p>
    <p><strong>Urgencia:</strong> <span class="badge ${urgenciaSelect.value}">${urgenciaSelect.value}</span></p>
  `;
}

// Errático: posible duplicado (<1 hora, mismo salón + categoría)
function findRecentDuplicate(reports, salonId, categoria) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return reports.find(
    (r) =>
      String(r.salon_id) === String(salonId) &&
      r.categoria === categoria &&
      new Date(r.fecha_creacion).getTime() > oneHourAgo,
  );
}

function submitReport() {
  const reports = getItem(REPORTS_KEY, []);
  const duplicate = findRecentDuplicate(reports, salonSelect.value, categoriaSelect.value);

  if (duplicate) {
    const sameIssue = confirm(
      `Ya reportaste "${duplicate.categoria}" en este salón hace menos de 1 hora (folio #${duplicate.id}). ¿Es lo mismo que reportaste antes?`,
    );
    if (sameIssue) {
      showResult(duplicate, true);
      return; // no se crea un ticket duplicado
    }
    // si no es lo mismo, se continúa y se crea un reporte nuevo
  }

  const salon = findSalon(salonSelect.value);
  const newReport = {
    id: nextId(reports),
    salon_id: salon.id,
    salon_label: `${salon.edificio} ${salon.numero}`,
    categoria: categoriaSelect.value,
    usuario_id: DEMO_USER_ID,
    descripcion: descripcionInput.value,
    estado: "recibido",
    urgencia: urgenciaSelect.value,
    fecha_creacion: new Date().toISOString(),
  };

  reports.push(newReport);
  setItem(REPORTS_KEY, reports);
  localStorage.removeItem(DRAFT_KEY);

  showResult(newReport, false);
}

function showResult(report, wasDuplicate) {
  form.style.display = "none";
  const result = document.getElementById("result");
  result.style.display = "block";
  result.innerHTML = `
    <h2>${wasDuplicate ? "Reporte ya existente" : "Reporte creado"}</h2>
    <p>Folio <strong>#${report.id}</strong> — <span class="badge ${report.estado}">${report.estado}</span></p>
    <p>${report.salon_label} · ${report.categoria} · <span class="badge ${report.urgencia}">${report.urgencia}</span></p>
    <p class="subtitle">Puedes ver su estado en <a href="atender.html">Atender</a>.</p>
    <a class="button" href="reportar.html">Reportar otra cosa</a>
  `;
}

init();
