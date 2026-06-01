const STORAGE_KEY = "jurassic-planner-v1";

const categoryLabels = {
  dino: "Dinossauro",
  event: "Evento",
  battle: "Batalha",
  park: "Parque",
  resources: "Recursos",
  other: "Outro",
};

const priorityLabels = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const taskStatusLabels = {
  pending: "Pendente",
  doing: "Fazendo",
  done: "Concluída",
};

const missionStatusLabels = {
  planned: "Planejada",
  doing: "Em andamento",
  done: "Concluída",
};

const timelineTypeLabels = {
  achievement: "Conquista",
  mission: "Missão",
  battle: "Batalha",
  evolution: "Evolução",
  hybrid: "Híbrido",
  park: "Parque",
  event: "Evento",
};

let state = hydrateState(loadStoredState());
let activeView = "dashboard";
let toastTimer = 0;
let previewUrl = "";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  setTodayOnTimelineForm();
  renderAll();
}

function bindEvents() {
  $$(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  $("#searchInput").addEventListener("input", renderAll);
  $("#quickTaskForm").addEventListener("submit", handleQuickTaskSubmit);
  $("#taskForm").addEventListener("submit", handleTaskSubmit);
  $("#missionForm").addEventListener("submit", handleMissionSubmit);
  $("#timelineForm").addEventListener("submit", handleTimelineSubmit);
  $("#settingsForm").addEventListener("submit", handleSettingsSubmit);
  $("#timelineImage").addEventListener("change", updateImagePreview);

  $("#newTaskButton").addEventListener("click", () => openTaskDialog());
  $("#newTaskFromDashboard").addEventListener("click", () => openTaskDialog());
  $("#newMissionButton").addEventListener("click", () => openMissionDialog());
  $("#exportButton").addEventListener("click", exportBackup);
  $("#importButton").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", importBackup);
  $("#clearDataButton").addEventListener("click", clearAllData);

  ["taskStatusFilter", "taskCategoryFilter", "missionStatusFilter", "timelineTypeFilter"].forEach((id) => {
    $(`#${id}`).addEventListener("change", renderAll);
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("change", handleDocumentChange);
  document.addEventListener("submit", handleInlineSubmit);
}

function handleDocumentClick(event) {
  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) {
    closeButton.closest("dialog")?.close();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id, missionId, stepId } = actionButton.dataset;

  if (action === "toggle-task") toggleTask(id);
  if (action === "edit-task") openTaskDialog(getTask(id));
  if (action === "delete-task") deleteTask(id);
  if (action === "edit-mission") openMissionDialog(getMission(id));
  if (action === "delete-mission") deleteMission(id);
  if (action === "delete-step") deleteMissionStep(missionId, stepId);
  if (action === "delete-timeline") deleteTimelineItem(id);
  if (action === "copy-image-url") copyImageUrl(id);
}

function handleDocumentChange(event) {
  const stepCheckbox = event.target.closest('[data-action="toggle-step"]');
  if (!stepCheckbox) return;
  toggleMissionStep(stepCheckbox.dataset.missionId, stepCheckbox.dataset.stepId, stepCheckbox.checked);
}

function handleInlineSubmit(event) {
  const stepForm = event.target.closest(".add-step-form");
  if (!stepForm) return;
  event.preventDefault();
  const input = stepForm.querySelector("input");
  const text = input.value.trim();
  if (!text) return;
  addMissionStep(stepForm.dataset.missionId, text);
  input.value = "";
}

function switchView(view) {
  activeView = view;
  $$(".tab-button").forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  $$(".view").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.viewPanel === view));
  renderAll();
}

function createEmptyState() {
  return {
    tasks: [],
    missions: [],
    timeline: [],
    settings: {
      cloudName: "",
      uploadPreset: "",
      folder: "jurassic-planner",
    },
  };
}

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createEmptyState();
  } catch (error) {
    console.warn("Não foi possível ler os dados salvos.", error);
    return createEmptyState();
  }
}

function hydrateState(value) {
  const base = createEmptyState();
  return {
    ...base,
    ...value,
    tasks: Array.isArray(value?.tasks) ? value.tasks : [],
    missions: Array.isArray(value?.missions) ? value.missions : [],
    timeline: Array.isArray(value?.timeline) ? value.timeline : [],
    settings: {
      ...base.settings,
      ...(value?.settings || {}),
    },
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Falha ao salvar.", error);
    showToast("O armazenamento local ficou cheio. Configure o Cloudinary ou exporte um backup.");
    return false;
  }
}

function saveAndRender(message) {
  saveState();
  renderAll();
  if (message) showToast(message);
}

function renderAll() {
  renderHeaderStatus();
  renderDashboard();
  renderTasks();
  renderMissions();
  renderTimeline();
  renderTimelineMissionOptions();
  fillSettingsForm();
  refreshIcons();
}

function renderHeaderStatus() {
  const badge = $("#syncBadge");
  const ready = isCloudinaryReady();
  badge.textContent = ready ? "Cloudinary pronto" : "Modo local";
  badge.classList.toggle("is-cloud", ready);
}

function renderDashboard() {
  const openTasks = state.tasks.filter((task) => task.status !== "done");
  const activeMissions = state.missions.filter((mission) => mission.status !== "done");
  const prints = state.timeline.filter((item) => item.imageUrl);
  const highPriority = state.tasks.filter((task) => task.priority === "high" && task.status !== "done");

  $("#openTaskCount").textContent = openTasks.length;
  $("#activeMissionCount").textContent = activeMissions.length;
  $("#printCount").textContent = prints.length;
  $("#highPriorityCount").textContent = highPriority.length;

  const dashboardTasks = [...openTasks].sort(sortTasks).slice(0, 5);
  $("#dashboardTaskList").innerHTML = dashboardTasks.length
    ? dashboardTasks.map(renderCompactTask).join("")
    : emptyState("check-circle-2", "Sem tarefas abertas");

  const dashboardMissions = [...activeMissions].sort(sortMissions).slice(0, 4);
  $("#dashboardMissionList").innerHTML = dashboardMissions.length
    ? dashboardMissions.map(renderCompactMission).join("")
    : emptyState("flag", "Sem missões em andamento");

  const recentPrints = prints.slice(0, 4);
  $("#dashboardTimelineList").innerHTML = recentPrints.length
    ? recentPrints.map(renderMiniPrint).join("")
    : emptyState("images", "Sem prints salvos");
}

function renderTasks() {
  const list = $("#taskList");
  const statusFilter = $("#taskStatusFilter").value;
  const categoryFilter = $("#taskCategoryFilter").value;
  const tasks = state.tasks
    .filter((task) => statusFilter === "all" || task.status === statusFilter)
    .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
    .filter((task) => matchesSearch([task.title, task.description, categoryLabels[task.category], taskStatusLabels[task.status]]))
    .sort(sortTasks);

  list.innerHTML = tasks.length ? tasks.map(renderTaskCard).join("") : emptyState("clipboard-list", "Nenhuma tarefa encontrada");
}

function renderMissions() {
  const list = $("#missionList");
  const statusFilter = $("#missionStatusFilter").value;
  const missions = state.missions
    .filter((mission) => statusFilter === "all" || mission.status === statusFilter)
    .filter((mission) => {
      const stepText = (mission.steps || []).map((step) => step.text).join(" ");
      return matchesSearch([mission.name, mission.description, missionStatusLabels[mission.status], stepText]);
    })
    .sort(sortMissions);

  list.innerHTML = missions.length ? missions.map(renderMissionCard).join("") : emptyState("flag", "Nenhuma missão encontrada");
}

function renderTimeline() {
  const list = $("#timelineList");
  const typeFilter = $("#timelineTypeFilter").value;
  const items = state.timeline
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .filter((item) => {
      const mission = item.missionId ? getMission(item.missionId) : null;
      return matchesSearch([item.title, item.description, timelineTypeLabels[item.type], mission?.name]);
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  list.innerHTML = items.length ? items.map(renderTimelineCard).join("") : emptyState("images", "Nenhum registro encontrado");
}

function renderTimelineMissionOptions() {
  const select = $("#timelineMissionSelect");
  const currentValue = select.value;
  select.innerHTML = `<option value="">Sem ligação</option>${state.missions
    .map((mission) => `<option value="${escapeHtml(mission.id)}">${escapeHtml(mission.name)}</option>`)
    .join("")}`;
  select.value = currentValue;
}

function renderTaskCard(task) {
  const done = task.status === "done";
  const description = task.description ? `<p class="item-description">${escapeHtml(task.description)}</p>` : "";
  const dueDate = task.dueDate ? `<span class="tag">${escapeHtml(formatDate(task.dueDate))}</span>` : "";

  return `
    <article class="task-card">
      <button class="status-toggle ${done ? "is-done" : ""}" type="button" data-action="toggle-task" data-id="${escapeHtml(task.id)}" title="${done ? "Reabrir" : "Concluir"}">
        <i data-lucide="${done ? "check" : "circle"}"></i>
      </button>
      <div class="item-main">
        <div class="item-title-row">
          <h3>${escapeHtml(task.title)}</h3>
          <span class="status-pill status-${escapeHtml(task.status)}">${escapeHtml(taskStatusLabels[task.status] || task.status)}</span>
          <span class="priority-pill priority-${escapeHtml(task.priority)}">${escapeHtml(priorityLabels[task.priority] || task.priority)}</span>
        </div>
        ${description}
        <div class="meta-row">
          <span class="tag">${escapeHtml(categoryLabels[task.category] || task.category)}</span>
          ${dueDate}
        </div>
      </div>
      <div class="card-actions">
        <button class="icon-button" type="button" data-action="edit-task" data-id="${escapeHtml(task.id)}" title="Editar">
          <i data-lucide="pencil"></i>
        </button>
        <button class="icon-button" type="button" data-action="delete-task" data-id="${escapeHtml(task.id)}" title="Apagar">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function renderMissionCard(mission) {
  const progress = getMissionProgress(mission);
  const steps = Array.isArray(mission.steps) ? mission.steps : [];
  const dueDate = mission.dueDate ? `<span class="tag">${escapeHtml(formatDate(mission.dueDate))}</span>` : "";
  const description = mission.description ? `<p class="mission-description">${escapeHtml(mission.description)}</p>` : "";
  const stepList = steps.length
    ? `<ul class="step-list">${steps.map((step) => renderMissionStep(mission.id, step)).join("")}</ul>`
    : `<p class="item-description">Sem etapas</p>`;

  return `
    <article class="mission-card">
      <div class="mission-top">
        <div>
          <div class="item-title-row">
            <h3>${escapeHtml(mission.name)}</h3>
            <span class="status-pill status-${escapeHtml(mission.status)}">${escapeHtml(missionStatusLabels[mission.status] || mission.status)}</span>
            ${dueDate}
          </div>
          ${description}
        </div>
        <div class="card-actions">
          <button class="icon-button" type="button" data-action="edit-mission" data-id="${escapeHtml(mission.id)}" title="Editar">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-button" type="button" data-action="delete-mission" data-id="${escapeHtml(mission.id)}" title="Apagar">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="progress-track" aria-label="Progresso ${progress}%">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      ${stepList}
      <form class="add-step-form" data-mission-id="${escapeHtml(mission.id)}">
        <input type="text" placeholder="Nova etapa" autocomplete="off" />
        <button class="secondary-button" type="submit" title="Adicionar etapa">
          <i data-lucide="plus"></i>
          <span>Etapa</span>
        </button>
      </form>
    </article>
  `;
}

function renderMissionStep(missionId, step) {
  return `
    <li class="${step.done ? "is-done" : ""}">
      <input type="checkbox" ${step.done ? "checked" : ""} data-action="toggle-step" data-mission-id="${escapeHtml(missionId)}" data-step-id="${escapeHtml(step.id)}" aria-label="Concluir etapa" />
      <span>${escapeHtml(step.text)}</span>
      <button class="icon-button" type="button" data-action="delete-step" data-mission-id="${escapeHtml(missionId)}" data-step-id="${escapeHtml(step.id)}" title="Apagar etapa">
        <i data-lucide="x"></i>
      </button>
    </li>
  `;
}

function renderTimelineCard(item) {
  const mission = item.missionId ? getMission(item.missionId) : null;
  const imageUrl = safeImageUrl(item.imageUrl);
  const media = imageUrl
    ? `<a class="timeline-media" href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" /></a>`
    : `<div class="timeline-media"><i data-lucide="image"></i></div>`;
  const description = item.description ? `<p>${escapeHtml(item.description)}</p>` : "";
  const source = item.source === "cloudinary" ? "Cloudinary" : item.source === "local" ? "Local" : "Sem imagem";
  const sourceClass = item.source === "cloudinary" ? "source-cloudinary" : "source-local";
  const copyButton = imageUrl
    ? `<button class="icon-button" type="button" data-action="copy-image-url" data-id="${escapeHtml(item.id)}" title="Copiar link"><i data-lucide="link"></i></button>`
    : "";

  return `
    <article class="timeline-card">
      ${media}
      <div class="timeline-content">
        <div class="item-title-row">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="tag">${escapeHtml(timelineTypeLabels[item.type] || item.type)}</span>
        </div>
        ${description}
        <div class="meta-row">
          <span class="status-pill">${escapeHtml(formatDate(item.date))}</span>
          ${mission ? `<span class="tag">${escapeHtml(mission.name)}</span>` : ""}
          <span class="source-pill ${sourceClass}">${escapeHtml(source)}</span>
        </div>
      </div>
      <div class="card-actions">
        ${copyButton}
        <button class="icon-button" type="button" data-action="delete-timeline" data-id="${escapeHtml(item.id)}" title="Apagar">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function renderCompactTask(task) {
  return `
    <article class="compact-item">
      <strong>${escapeHtml(task.title)}</strong>
      <span>${escapeHtml(categoryLabels[task.category] || task.category)} · ${escapeHtml(priorityLabels[task.priority] || task.priority)}${task.dueDate ? ` · ${escapeHtml(formatDate(task.dueDate))}` : ""}</span>
    </article>
  `;
}

function renderCompactMission(mission) {
  return `
    <article class="compact-item">
      <strong>${escapeHtml(mission.name)}</strong>
      <span>${getMissionProgress(mission)}% · ${escapeHtml(missionStatusLabels[mission.status] || mission.status)}</span>
    </article>
  `;
}

function renderMiniPrint(item) {
  const imageUrl = safeImageUrl(item.imageUrl);
  return imageUrl
    ? `<a class="mini-print" href="${escapeHtml(imageUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(item.title)}"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" /></a>`
    : `<div class="mini-print"></div>`;
}

function handleQuickTaskSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  state.tasks.unshift({
    id: createId(),
    title,
    description: "",
    status: "pending",
    priority: formData.get("priority") || "medium",
    category: formData.get("category") || "other",
    dueDate: "",
    createdAt: new Date().toISOString(),
  });

  event.currentTarget.reset();
  saveAndRender("Tarefa adicionada.");
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const task = {
    id,
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "pending",
    priority: data.priority || "medium",
    category: data.category || "other",
    dueDate: data.dueDate || "",
    createdAt: getTask(id)?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!task.title) return;

  const index = state.tasks.findIndex((item) => item.id === id);
  if (index >= 0) state.tasks[index] = task;
  else state.tasks.unshift(task);

  $("#taskDialog").close();
  saveAndRender("Tarefa salva.");
}

function handleMissionSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const existing = getMission(id);
  const steps = String(data.steps || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => {
      const previous = existing?.steps?.[index]?.text === text ? existing.steps[index] : existing?.steps?.find((step) => step.text === text);
      return {
        id: previous?.id || createId(),
        text,
        done: Boolean(previous?.done),
      };
    });

  const mission = {
    id,
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "planned",
    dueDate: data.dueDate || "",
    steps,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!mission.name) return;

  const index = state.missions.findIndex((item) => item.id === id);
  if (index >= 0) state.missions[index] = mission;
  else state.missions.unshift(mission);

  $("#missionDialog").close();
  saveAndRender("Missão salva.");
}

async function handleTimelineSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const title = String(data.title || "").trim();
  const file = $("#timelineImage").files[0];
  if (!title) return;

  const button = $("#saveTimelineButton");
  const label = button.querySelector("span");
  const previousLabel = label.textContent;
  button.disabled = true;
  label.textContent = "Salvando";

  try {
    let image = { url: "", publicId: "", source: "none" };
    if (file) image = await saveTimelineImage(file);

    state.timeline.unshift({
      id: createId(),
      title,
      description: String(data.description || "").trim(),
      type: data.type || "achievement",
      date: data.date || todayIso(),
      missionId: data.missionId || "",
      imageUrl: image.url,
      publicId: image.publicId,
      source: image.source,
      createdAt: new Date().toISOString(),
    });

    form.reset();
    setTodayOnTimelineForm();
    resetImagePreview();
    saveAndRender(image.source === "cloudinary" ? "Print enviado para Cloudinary." : "Registro salvo.");
  } catch (error) {
    console.error(error);
    showToast("Não consegui salvar esse registro.");
  } finally {
    button.disabled = false;
    label.textContent = previousLabel;
    refreshIcons();
  }
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  state.settings = {
    cloudName: String(data.cloudName || "").trim(),
    uploadPreset: String(data.uploadPreset || "").trim(),
    folder: String(data.folder || "").trim() || "jurassic-planner",
  };
  saveAndRender("Configuração salva.");
}

function openTaskDialog(task = null) {
  const form = $("#taskForm");
  form.reset();
  $("#taskDialogTitle").textContent = task ? "Editar tarefa" : "Nova tarefa";
  form.elements.id.value = task?.id || "";
  form.elements.title.value = task?.title || "";
  form.elements.description.value = task?.description || "";
  form.elements.status.value = task?.status || "pending";
  form.elements.priority.value = task?.priority || "medium";
  form.elements.category.value = task?.category || "dino";
  form.elements.dueDate.value = task?.dueDate || "";
  showDialog("#taskDialog");
}

function openMissionDialog(mission = null) {
  const form = $("#missionForm");
  form.reset();
  $("#missionDialogTitle").textContent = mission ? "Editar missão" : "Nova missão";
  form.elements.id.value = mission?.id || "";
  form.elements.name.value = mission?.name || "";
  form.elements.description.value = mission?.description || "";
  form.elements.status.value = mission?.status || "planned";
  form.elements.dueDate.value = mission?.dueDate || "";
  form.elements.steps.value = (mission?.steps || []).map((step) => step.text).join("\n");
  showDialog("#missionDialog");
}

function showDialog(selector) {
  const dialog = $(selector);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  refreshIcons();
}

function toggleTask(id) {
  const task = getTask(id);
  if (!task) return;
  task.status = task.status === "done" ? "pending" : "done";
  task.updatedAt = new Date().toISOString();
  saveAndRender(task.status === "done" ? "Tarefa concluída." : "Tarefa reaberta.");
}

function deleteTask(id) {
  const task = getTask(id);
  if (!task || !confirm(`Apagar "${task.title}"?`)) return;
  state.tasks = state.tasks.filter((item) => item.id !== id);
  saveAndRender("Tarefa apagada.");
}

function deleteMission(id) {
  const mission = getMission(id);
  if (!mission || !confirm(`Apagar "${mission.name}"?`)) return;
  state.missions = state.missions.filter((item) => item.id !== id);
  state.timeline = state.timeline.map((item) => (item.missionId === id ? { ...item, missionId: "" } : item));
  saveAndRender("Missão apagada.");
}

function addMissionStep(missionId, text) {
  const mission = getMission(missionId);
  if (!mission) return;
  mission.steps = [...(mission.steps || []), { id: createId(), text, done: false }];
  if (mission.status === "planned") mission.status = "doing";
  mission.updatedAt = new Date().toISOString();
  saveAndRender("Etapa adicionada.");
}

function toggleMissionStep(missionId, stepId, done) {
  const mission = getMission(missionId);
  const step = mission?.steps?.find((item) => item.id === stepId);
  if (!mission || !step) return;
  step.done = done;
  const progress = getMissionProgress(mission);
  mission.status = progress === 100 ? "done" : mission.status === "done" ? "doing" : mission.status;
  mission.updatedAt = new Date().toISOString();
  saveAndRender(done ? "Etapa concluída." : "Etapa reaberta.");
}

function deleteMissionStep(missionId, stepId) {
  const mission = getMission(missionId);
  if (!mission) return;
  mission.steps = (mission.steps || []).filter((step) => step.id !== stepId);
  mission.updatedAt = new Date().toISOString();
  saveAndRender("Etapa apagada.");
}

function deleteTimelineItem(id) {
  const item = state.timeline.find((entry) => entry.id === id);
  if (!item || !confirm(`Apagar "${item.title}" da timeline?`)) return;
  state.timeline = state.timeline.filter((entry) => entry.id !== id);
  saveAndRender("Registro apagado.");
}

async function copyImageUrl(id) {
  const item = state.timeline.find((entry) => entry.id === id);
  const imageUrl = safeImageUrl(item?.imageUrl);
  if (!imageUrl) return;
  try {
    await navigator.clipboard.writeText(imageUrl);
    showToast("Link copiado.");
  } catch (error) {
    console.warn(error);
    showToast("Não consegui copiar o link.");
  }
}

async function saveTimelineImage(file) {
  if (isCloudinaryReady()) {
    try {
      const uploadFile = await resizeImage(file, 1800, 0.9);
      return await uploadToCloudinary(uploadFile);
    } catch (error) {
      console.warn("Upload Cloudinary falhou.", error);
      showToast("Cloudinary recusou o upload. Salvei o print localmente.");
    }
  }

  const localFile = await resizeImage(file, 1400, 0.82);
  const dataUrl = await blobToDataUrl(localFile);
  return { url: dataUrl, publicId: "", source: "local" };
}

async function uploadToCloudinary(file) {
  const { cloudName, uploadPreset, folder } = state.settings;
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  if (folder) body.append("folder", folder);
  body.append("tags", "jurassic-planner");

  const response = await fetch(endpoint, {
    method: "POST",
    body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || "Upload recusado pelo Cloudinary.";
    throw new Error(message);
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    source: "cloudinary",
  };
}

function resizeImage(file, maxSize, quality) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith("image/")) {
      resolve(file);
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const largestSide = Math.max(image.width, image.height);
      const scale = largestSide > maxSize ? maxSize / largestSide : 1;

      if (scale === 1 && file.size < 900000) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "") || "print";
          resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    image.src = url;
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function updateImagePreview() {
  const file = $("#timelineImage").files[0];
  resetImagePreview(false);
  if (!file) return;
  previewUrl = URL.createObjectURL(file);
  $("#imagePreview").innerHTML = `<img src="${escapeHtml(previewUrl)}" alt="Prévia do print" />`;
}

function resetImagePreview(refresh = true) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = "";
  $("#imagePreview").innerHTML = `<i data-lucide="image-plus"></i>`;
  if (refresh) refreshIcons();
}

function fillSettingsForm() {
  const form = $("#settingsForm");
  if (form.contains(document.activeElement)) return;
  form.elements.cloudName.value = state.settings.cloudName || "";
  form.elements.uploadPreset.value = state.settings.uploadPreset || "";
  form.elements.folder.value = state.settings.folder || "jurassic-planner";
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jurassic-planner-backup-${todayIso()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Backup exportado.");
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = hydrateState(JSON.parse(reader.result));
      if (!confirm("Importar esse backup e substituir os dados atuais?")) return;
      state = imported;
      saveAndRender("Backup importado.");
    } catch (error) {
      console.error(error);
      showToast("Esse arquivo não parece ser um backup válido.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm("Limpar todos os dados deste navegador?")) return;
  state = createEmptyState();
  saveAndRender("Dados limpos.");
}

function getTask(id) {
  return state.tasks.find((task) => task.id === id);
}

function getMission(id) {
  return state.missions.find((mission) => mission.id === id);
}

function getMissionProgress(mission) {
  const steps = Array.isArray(mission.steps) ? mission.steps : [];
  if (!steps.length) return mission.status === "done" ? 100 : 0;
  return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
}

function sortTasks(a, b) {
  const statusRank = { doing: 0, pending: 1, done: 2 };
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return (
    (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) ||
    (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
    (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

function sortMissions(a, b) {
  const statusRank = { doing: 0, planned: 1, done: 2 };
  return (
    (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) ||
    (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

function isCloudinaryReady() {
  return Boolean(state.settings.cloudName && state.settings.uploadPreset);
}

function setTodayOnTimelineForm() {
  $("#timelineForm").elements.date.value = todayIso();
}

function todayIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Sem data";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function matchesSearch(values) {
  const query = normalizeText($("#searchInput").value);
  if (!query) return true;
  return normalizeText(values.filter(Boolean).join(" ")).includes(query);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function safeImageUrl(url) {
  const value = String(url || "");
  if (value.startsWith("https://res.cloudinary.com/")) return value;
  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("blob:")) return value;
  return "";
}

function emptyState(icon, text) {
  return `
    <div class="empty-state">
      <i data-lucide="${escapeHtml(icon)}"></i>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function showToast(message) {
  const toast = $("#toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}
