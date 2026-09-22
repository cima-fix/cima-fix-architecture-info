// reportar.js -- "Reportar incidencia" task flow (Carlos, Fase 2), end to end.
//
// Covers what the task flow asks for:
//  - Happy path: salon -> category -> details+urgency -> confirm -> ticket created
//  - Side door: arrives with ?salon=<id> (simulates the QR) instead of picking manually
//  - Erratic 1: invalid QR -> no ticket created, shows an explicit error
//  - Erratic 2: abandons mid-form -> local draft, recovered on return
//  - Erratic 3: reports the same thing <1 hour ago -> asks before duplicating

const REPORTS_KEY = createStorageKey("reportes");
const DRAFT_KEY = createStorageKey("reportes:borrador");
const DEMO_USER_ID = 1; // simulated "logged-in" user for this prototype

const form = document.getElementById("report-form");
const qrError = document.getElementById("qr-error");
const salonSelect = document.getElementById("salon");
const categoriaSelect = document.getElementById("categoria");
const descripcionInput = document.getElementById("descripcion");
const urgenciaSelect = document.getElementById("urgencia");

function init() {
  const params = new URLSearchParams(window.location.search);
  const qrSalon = params.get("salon");

  // Erratic: invalid QR / unregistered salon -> no ticket is created
  if (qrSalon && !findSalon(qrSalon)) {
    qrError.style.display = "block";
    return;
  }

  form.style.display = "block";
  populateSelects();

  if (qrSalon) {
    salonSelect.value = qrSalon;
    salonSelect.disabled = true; // came from the QR, not picked by hand
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

// Erratic: mid-form abandonment -> local draft
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

  const resume = confirm("You have an unfinished report. Do you want to continue it?");
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

// Erratic: possible duplicate (<1 hour, same salon + category)
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
      `You already reported "${duplicate.categoria}" in this salon less than 1 hour ago (ticket #${duplicate.id}). Is this the same thing you reported before?`,
    );
    if (sameIssue) {
      showResult(duplicate, true);
      return; // don't create a duplicate ticket
    }
    // if it's not the same, continue and create a new report
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
    <h2>${wasDuplicate ? "Existing report" : "Report created"}</h2>
    <p>Ticket <strong>#${report.id}</strong> — <span class="badge ${report.estado}">${report.estado}</span></p>
    <p>${report.salon_label} · ${report.categoria} · <span class="badge ${report.urgencia}">${report.urgencia}</span></p>
    <p class="subtitle">You can check its status in <a href="atender.html">Atender</a>.</p>
    <a class="button" href="reportar.html">Report something else</a>
  `;
}

init();
