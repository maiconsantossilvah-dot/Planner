const STORAGE_KEY = "jurassic-planner-v1";
const AUTO_BACKUP_KEY = "jurassic-planner-auto-backup-v2";
const TRANSLATION_CACHE_KEY = "jurassic-planner-translation-cache-v1";
const PALEO_NEWS_CACHE_KEY = "jurassic-planner-paleo-news-cache-v1";
const SCHEMA_VERSION = 3;
const DINO_WIKI_API = "https://jurassic-world-the-mobile-game.fandom.com/api.php";
const DINO_WIKI_BASE = "https://jurassic-world-the-mobile-game.fandom.com/wiki/";
const DINO_WIKI_SOURCE_NAME = "Jurassic World: The Game Wiki";
const PALEO_CREATURES_URL = "https://www.paleo.gg/games/jurassic-world-the-game/creatures";
const PALEO_SOURCE_NAME = "Paleo.gg (Jurassic World: The Game)";
const PALEO_CDN_BASE = "https://cdn.paleo.gg/games";
const PALEO_NEXT_DATA_BASE = "https://www.paleo.gg/_next/data";
const PALEO_NEWS_SEED = "indominus_rex";
const JINA_READER_PREFIX = "https://r.jina.ai/http://r.jina.ai/http://";
const TRANSLATION_API = "https://api.mymemory.translated.net/get";

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

const recurrenceLabels = {
  none: "Única",
  daily: "Diária",
  weekly: "Semanal",
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

const calendarTypeLabels = {
  "game-event": "Evento do jogo",
  task: "Tarefa",
  mission: "Missão",
  goal: "Meta",
  resources: "Recursos",
  battle: "Batalha",
  other: "Outro",
};

const dinoClassLabels = {
  carnivore: "Carnívoro",
  herbivore: "Herbívoro",
  pterosaur: "Pterossauro",
  amphibian: "Anfíbio",
  aquatic: "Aquático",
  cenozoic: "Cenozóico",
  hybrid: "Híbrido",
};

const dinoRarityLabels = {
  common: "Comum",
  rare: "Raro",
  "super-rare": "Super raro",
  legendary: "Lendário",
  vip: "VIP",
  tournament: "Torneio",
  star: "Star",
  "super-star": "Super Star",
  boss: "Boss",
};

let state = hydrateState(loadStoredState());
let pendingImportState = null;
let activeView = "dashboard";
let toastTimer = 0;
let previewUrls = [];
let viewerState = {
  itemId: "",
  imageIndex: 0,
};
let pendingDinoWikiData = null;
let newsState = {
  status: "idle",
  items: [],
  updatedAt: "",
  message: "Abra a aba para carregar os últimos dinos.",
  progress: "",
};

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
  $("#calendarForm").addEventListener("submit", handleCalendarSubmit);
  $("#dinoForm").addEventListener("submit", handleDinoSubmit);
  $("#dinoCopyForm").addEventListener("submit", handleDinoCopySubmit);
  ["currentLevel", "targetLevel"].forEach((name) => {
    $("#dinoForm").elements[name].addEventListener("input", () => updateDinoResourceFields());
  });
  $("#goalForm").addEventListener("submit", handleGoalSubmit);
  $("#timelineForm").addEventListener("submit", handleTimelineSubmit);
  $("#settingsForm").addEventListener("submit", handleSettingsSubmit);
  $("#timelineImage").addEventListener("change", updateImagePreview);

  $("#newTaskButton").addEventListener("click", () => openTaskDialog());
  $("#newTaskFromDashboard").addEventListener("click", () => openTaskDialog());
  $("#newMissionButton").addEventListener("click", () => openMissionDialog());
  $("#newCalendarEventButton").addEventListener("click", () => openCalendarDialog());
  $("#newDinoButton").addEventListener("click", () => openDinoDialog());
  $("#newGoalButton").addEventListener("click", () => openGoalDialog());
  $("#fetchDinoWikiButton").addEventListener("click", fetchDinoWikiFromForm);
  $("#refreshNewsButton").addEventListener("click", () => loadPaleoNews({ force: true }));
  $("#resetRecurringButton").addEventListener("click", resetRecurringTasks);
  $("#resetRecurringFromTasks").addEventListener("click", resetRecurringTasks);
  $("#cancelTimelineEdit").addEventListener("click", resetTimelineForm);
  $("#exportTimelineButton").addEventListener("click", exportTimelineHtml);
  $("#testCloudinaryButton").addEventListener("click", testCloudinary);
  $("#exportButton").addEventListener("click", exportBackup);
  $("#importButton").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", importBackup);
  $("#confirmImportButton").addEventListener("click", confirmImportBackup);
  $("#clearLocalImagesButton").addEventListener("click", clearLocalImages);
  $("#clearDataButton").addEventListener("click", clearAllData);
  $("#prevImageButton").addEventListener("click", () => moveImageViewer(-1));
  $("#nextImageButton").addEventListener("click", () => moveImageViewer(1));

  [
    "taskStatusFilter",
    "taskCategoryFilter",
    "taskDateFilter",
    "missionStatusFilter",
    "missionCategoryFilter",
    "timelineTypeFilter",
    "timelineMissionFilter",
    "timelineSort",
    "timelineDateFrom",
    "timelineDateTo",
    "calendarTypeFilter",
    "calendarDateFrom",
    "calendarDateTo",
    "dinoClassFilter",
    "dinoRarityFilter",
    "goalStatusFilter",
    "galleryTypeFilter",
    "galleryMissionFilter",
    "galleryTagFilter",
  ].forEach((id) => {
    $(`#${id}`).addEventListener("change", renderAll);
  });
  $("#galleryTagFilter").addEventListener("input", renderAll);

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

  const { action, id, missionId, stepId, imageId } = actionButton.dataset;
  if (action === "open-dino-detail" && actionButton.classList.contains("dino-card") && event.target.closest("a, button, input, select, textarea")) return;

  if (action === "toggle-task") toggleTask(id);
  if (action === "edit-task") openTaskDialog(getTask(id));
  if (action === "delete-task") deleteTask(id);
  if (action === "edit-mission") openMissionDialog(getMission(id));
  if (action === "delete-mission") deleteMission(id);
  if (action === "edit-calendar") openCalendarDialog(getCalendarEvent(id));
  if (action === "delete-calendar") deleteCalendarEvent(id);
  if (action === "edit-dino") openDinoDialog(getDino(id));
  if (action === "open-dino-detail") openDinoDetailDialog(getDino(id));
  if (action === "delete-dino") deleteDino(id);
  if (action === "delete-dino-copy") deleteDinoCopy(id, actionButton.dataset.copyId);
  if (action === "apply-dino-wiki") applyPendingDinoWikiData();
  if (action === "edit-goal") openGoalDialog(getGoal(id));
  if (action === "delete-goal") deleteGoal(id);
  if (action === "goal-step") updateGoalProgress(id, Number(actionButton.dataset.amount || 0));
  if (action === "delete-step") deleteMissionStep(missionId, stepId);
  if (action === "move-step-up") moveMissionStep(missionId, stepId, -1);
  if (action === "move-step-down") moveMissionStep(missionId, stepId, 1);
  if (action === "edit-timeline") openTimelineForEdit(id);
  if (action === "delete-timeline") deleteTimelineItem(id);
  if (action === "open-image") openImageViewer(id, imageId);
  if (action === "copy-image-url") copyImageUrl(id, imageId);
  if (action === "delete-timeline-image") deleteTimelineImage(id, imageId);
}

function handleDocumentChange(event) {
  const copyLevelInput = event.target.closest('[data-action="update-dino-copy"]');
  if (copyLevelInput) {
    updateDinoCopyLevel(copyLevelInput.dataset.id, copyLevelInput.dataset.copyId, copyLevelInput.value);
    return;
  }

  const stepCheckbox = event.target.closest('[data-action="toggle-step"]');
  if (!stepCheckbox) return;
  toggleMissionStep(stepCheckbox.dataset.missionId, stepCheckbox.dataset.stepId, stepCheckbox.checked);
}

function handleInlineSubmit(event) {
  const stepForm = event.target.closest(".add-step-form");
  if (!stepForm) return;
  event.preventDefault();
  const input = stepForm.querySelector("input");
  const parsed = parseStepLine(input.value.trim());
  if (!parsed.text) return;
  addMissionStep(stepForm.dataset.missionId, parsed.text, parsed.note);
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
  if (view === "news") loadPaleoNews({ force: true });
}

function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: [],
    missions: [],
    calendarEvents: [],
    dinosaurs: [],
    goals: [],
    timeline: [],
    settings: {
      cloudName: "",
      uploadPreset: "",
      folder: "jurassic-planner",
      cloudinaryStatus: "not-configured",
      cloudinaryMessage: "Preencha os campos e faça um teste de envio.",
      testedAt: "",
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
  const source = value?.data && value?.app === "jurassic-planner" ? value.data : value;
  const base = createEmptyState();
  const hydrated = {
    ...base,
    ...(source || {}),
    schemaVersion: SCHEMA_VERSION,
    tasks: Array.isArray(source?.tasks) ? source.tasks.map(hydrateTask) : [],
    missions: Array.isArray(source?.missions) ? source.missions.map(hydrateMission) : [],
    calendarEvents: Array.isArray(source?.calendarEvents) ? source.calendarEvents.map(hydrateCalendarEvent) : [],
    dinosaurs: Array.isArray(source?.dinosaurs) ? source.dinosaurs.map(hydrateDino) : [],
    goals: Array.isArray(source?.goals) ? source.goals.map(hydrateGoal) : [],
    timeline: Array.isArray(source?.timeline) ? source.timeline.map(hydrateTimelineItem) : [],
    settings: {
      ...base.settings,
      ...(source?.settings || {}),
    },
  };

  if (!isCloudinaryReady(hydrated.settings)) {
    hydrated.settings.cloudinaryStatus = "not-configured";
  }

  hydrated.missions.forEach((mission) => autoUpdateMissionStatus(mission, mission.status, { dinosaurs: hydrated.dinosaurs }));
  return hydrated;
}

function hydrateTask(task) {
  return {
    id: task.id || createId(),
    title: task.title || "Tarefa sem título",
    description: task.description || "",
    status: task.status || "pending",
    priority: task.priority || "medium",
    category: task.category || "other",
    dueDate: task.dueDate || "",
    recurrence: task.recurrence || "none",
    tags: normalizeTags(task.tags),
    completedAt: task.completedAt || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || "",
  };
}

function hydrateMission(mission) {
  const steps = Array.isArray(mission.steps)
    ? mission.steps.map((step, index) => ({
        id: step.id || createId(),
        text: step.text || `Etapa ${index + 1}`,
        note: step.note || "",
        done: Boolean(step.done),
        order: Number.isFinite(step.order) ? step.order : index,
      }))
    : [];

  return {
    id: mission.id || createId(),
    name: mission.name || "Missão sem nome",
    description: mission.description || "",
    status: mission.status || "planned",
    priority: mission.priority || "medium",
    category: mission.category || "other",
    dueDate: mission.dueDate || "",
    steps,
    dinoIds: normalizeMissionDinoIds(mission.dinoIds),
    tags: normalizeTags(mission.tags),
    createdAt: mission.createdAt || new Date().toISOString(),
    updatedAt: mission.updatedAt || "",
    completedAt: mission.completedAt || "",
  };
}

function hydrateCalendarEvent(event) {
  return {
    id: event.id || createId(),
    title: event.title || "Evento sem título",
    description: event.description || "",
    type: event.type || "game-event",
    date: event.date || todayIso(),
    tags: normalizeTags(event.tags),
    createdAt: event.createdAt || new Date().toISOString(),
    updatedAt: event.updatedAt || "",
  };
}

function hydrateDino(dino) {
  const foodCosts = normalizeDinoFoodCosts(dino.foodCosts);
  const dnaPrice = Math.max(0, toNumber(dino.dnaPrice, dino.wikiTitle ? dino.dnaNeeded : 0));
  const hydrated = {
    id: dino.id || createId(),
    name: stripText(dino.name) || "Dino sem nome",
    classType: dino.classType || "carnivore",
    rarity: dino.rarity || "common",
    currentLevel: toNumber(dino.currentLevel, 1),
    targetLevel: toNumber(dino.targetLevel, 40),
    dnaPrice,
    foodCosts,
    dnaNeeded: toNumber(dino.dnaNeeded, 0),
    foodNeeded: toNumber(dino.foodNeeded, 0),
    missionId: dino.missionId || "",
    notes: dino.notes || "",
    wikiTitle: dino.wikiTitle || "",
    wikiUrl: dino.wikiUrl || "",
    wikiImageUrl: dino.wikiImageUrl || "",
    sourceName: dino.sourceName || getDinoSourceName(dino.wikiUrl),
    wikiClass: dino.wikiClass || "",
    wikiRarity: dino.wikiRarity || "",
    incubationTime: dino.incubationTime || "",
    parents: dino.parents || "",
    hybrids: dino.hybrids || "",
    health40: dino.health40 || "",
    damage40: dino.damage40 || "",
    coinsPerMinute: dino.coinsPerMinute || "",
    copies: normalizeDinoCopies(dino.copies),
    tags: normalizeTags(dino.tags),
    createdAt: dino.createdAt || new Date().toISOString(),
    updatedAt: dino.updatedAt || "",
  };
  const resources = calculateDinoResources(hydrated);
  return {
    ...hydrated,
    dnaNeeded: resources.hasDnaPrice ? resources.dnaNeeded : hydrated.dnaNeeded,
    foodNeeded: resources.hasFoodCosts ? resources.foodNeeded : hydrated.foodNeeded,
  };
}

function hydrateGoal(goal) {
  const target = Math.max(1, toNumber(goal.target, 1));
  const current = Math.max(0, toNumber(goal.current, 0));
  return {
    id: goal.id || createId(),
    title: goal.title || "Meta sem título",
    current,
    target,
    unit: goal.unit || "",
    dueDate: goal.dueDate || "",
    notes: goal.notes || "",
    tags: normalizeTags(goal.tags),
    createdAt: goal.createdAt || new Date().toISOString(),
    updatedAt: goal.updatedAt || "",
    completedAt: current >= target ? goal.completedAt || new Date().toISOString() : "",
  };
}

function hydrateTimelineItem(item) {
  const legacyImage = item.imageUrl
    ? [
        {
          id: createId(),
          url: item.imageUrl,
          publicId: item.publicId || "",
          source: item.source || guessImageSource(item.imageUrl),
          width: item.width || 0,
          height: item.height || 0,
          createdAt: item.createdAt || new Date().toISOString(),
        },
      ]
    : [];

  return {
    id: item.id || createId(),
    title: item.title || "Registro sem título",
    description: item.description || "",
    type: item.type || "achievement",
    date: item.date || todayIso(),
    missionId: item.missionId || "",
    taskId: item.taskId || "",
    tags: normalizeTags(item.tags),
    images: Array.isArray(item.images) ? item.images.map(hydrateImage) : legacyImage,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || "",
  };
}

function hydrateImage(image) {
  return {
    id: image.id || createId(),
    url: image.url || "",
    publicId: image.publicId || "",
    source: image.source || guessImageSource(image.url),
    width: image.width || 0,
    height: image.height || 0,
    createdAt: image.createdAt || new Date().toISOString(),
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    writeAutoBackup();
    return true;
  } catch (error) {
    console.error("Falha ao salvar.", error);
    showToast("O armazenamento local ficou cheio. Exporte um backup e limpe prints locais.");
    return false;
  }
}

function writeAutoBackup() {
  try {
    const payload = getBackupPayload();
    const raw = JSON.stringify(payload);
    if (raw.length < 1800000) {
      localStorage.setItem(AUTO_BACKUP_KEY, raw);
    } else {
      localStorage.setItem(
        AUTO_BACKUP_KEY,
        JSON.stringify({
          app: "jurassic-planner",
          schemaVersion: SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          skippedImages: true,
          data: {
            ...state,
            timeline: state.timeline.map((item) => ({ ...item, images: item.images.filter((image) => image.source === "cloudinary") })),
          },
        }),
      );
    }
  } catch (error) {
    console.warn("Backup automático ignorado.", error);
  }
}

function readPaleoNewsCache() {
  try {
    const raw = localStorage.getItem(PALEO_NEWS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePaleoNewsCache(cache) {
  try {
    localStorage.setItem(
      PALEO_NEWS_CACHE_KEY,
      JSON.stringify({
        buildId: cache.buildId,
        items: cache.items || [],
        updatedAt: cache.updatedAt || new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn("Cache de news ignorado.", error);
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
  renderCalendar();
  renderDinosaurs();
  renderNews();
  renderGoals();
  renderTimeline();
  renderTimelineMissionOptions();
  renderGallery();
  fillSettingsForm();
  renderCloudinaryStatus();
  renderBackupStatus();
  refreshIcons();
}

function renderHeaderStatus() {
  const badge = $("#syncBadge");
  const status = state.settings.cloudinaryStatus;
  badge.classList.remove("is-cloud", "is-error");

  if (status === "ready") {
    badge.textContent = "Cloudinary OK";
    badge.classList.add("is-cloud");
  } else if (status === "error") {
    badge.textContent = "Cloudinary com erro";
    badge.classList.add("is-error");
  } else {
    badge.textContent = "Modo local";
  }
}

function renderDashboard() {
  const openTasks = state.tasks.filter((task) => task.status !== "done");
  const activeMissions = state.missions.filter((mission) => mission.status !== "done");
  const printCount = state.timeline.reduce((total, item) => total + getTimelineImages(item).length, 0);
  const overdueTasks = state.tasks.filter(isOverdue);

  $("#openTaskCount").textContent = openTasks.length;
  $("#activeMissionCount").textContent = activeMissions.length;
  $("#printCount").textContent = printCount;
  $("#overdueTaskCount").textContent = overdueTasks.length;
  $("#dinoCount").textContent = state.dinosaurs.length;
  $("#activeGoalCount").textContent = state.goals.filter((goal) => !isGoalDone(goal)).length;

  const insights = getSmartInsights();
  $("#dashboardInsightList").innerHTML = insights.length
    ? insights.map(renderInsight).join("")
    : emptyState("sparkles", "Sem alertas importantes agora");

  const dashboardTasks = [...openTasks].sort(sortTasks).slice(0, 5);
  $("#dashboardTaskList").innerHTML = dashboardTasks.length
    ? dashboardTasks.map(renderCompactTask).join("")
    : emptyState("check-circle-2", "Sem tarefas abertas");

  const dashboardMissions = [...activeMissions].sort(sortMissions).slice(0, 4);
  $("#dashboardMissionList").innerHTML = dashboardMissions.length
    ? dashboardMissions.map(renderCompactMission).join("")
    : emptyState("flag", "Sem missões em andamento");

  const recentPrints = state.timeline.flatMap((item) => getTimelineImages(item).map((image) => ({ item, image }))).slice(0, 4);
  $("#dashboardTimelineList").innerHTML = recentPrints.length
    ? recentPrints.map(renderMiniPrint).join("")
    : emptyState("images", "Sem prints salvos");
}

function renderTasks() {
  const list = $("#taskList");
  const statusFilter = $("#taskStatusFilter").value;
  const categoryFilter = $("#taskCategoryFilter").value;
  const dateFilter = $("#taskDateFilter").value;

  const tasks = state.tasks
    .filter((task) => statusFilter === "all" || task.status === statusFilter)
    .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
    .filter((task) => {
      if (dateFilter === "today") return isDueToday(task);
      if (dateFilter === "overdue") return isOverdue(task);
      if (dateFilter === "recurring") return task.recurrence && task.recurrence !== "none";
      return true;
    })
    .filter((task) => matchesSearch([task.title, task.description, categoryLabels[task.category], taskStatusLabels[task.status], recurrenceLabels[task.recurrence], ...task.tags]))
    .sort(sortTasks);

  list.innerHTML = tasks.length ? tasks.map(renderTaskCard).join("") : emptyState("clipboard-list", "Nenhuma tarefa encontrada");
}

function renderMissions() {
  const list = $("#missionList");
  const statusFilter = $("#missionStatusFilter").value;
  const categoryFilter = $("#missionCategoryFilter").value;
  const missions = state.missions
    .filter((mission) => statusFilter === "all" || mission.status === statusFilter)
    .filter((mission) => categoryFilter === "all" || mission.category === categoryFilter)
    .filter((mission) => {
      const stepText = normalizeMissionSteps(mission).map((step) => `${step.text} ${step.note}`).join(" ");
      return matchesSearch([mission.name, mission.description, missionStatusLabels[mission.status], categoryLabels[mission.category], stepText, ...mission.tags]);
    })
    .sort(sortMissions);

  list.innerHTML = missions.length ? missions.map(renderMissionCard).join("") : emptyState("flag", "Nenhuma missão encontrada");
}

function renderCalendar() {
  const list = $("#calendarList");
  const typeFilter = $("#calendarTypeFilter").value;
  const dateFrom = $("#calendarDateFrom").value;
  const dateTo = $("#calendarDateTo").value;
  const items = getAgendaItems()
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .filter((item) => !dateFrom || item.date >= dateFrom)
    .filter((item) => !dateTo || item.date <= dateTo)
    .filter((item) => matchesSearch([item.title, item.description, calendarTypeLabels[item.type], ...(item.tags || [])]))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  list.innerHTML = items.length ? items.map(renderAgendaItem).join("") : emptyState("calendar-days", "Nada no calendário");
}

function renderDinosaurs() {
  const list = $("#dinoList");
  const classFilter = $("#dinoClassFilter").value;
  const rarityFilter = $("#dinoRarityFilter").value;
  const dinos = state.dinosaurs
    .filter((dino) => classFilter === "all" || dino.classType === classFilter)
    .filter((dino) => rarityFilter === "all" || dino.rarity === rarityFilter)
    .filter((dino) => {
      const mission = dino.missionId ? getMission(dino.missionId) : null;
      return matchesSearch([dino.name, dino.notes, dinoClassLabels[dino.classType], dinoRarityLabels[dino.rarity], mission?.name, ...dino.tags]);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  list.innerHTML = dinos.length ? dinos.map(renderDinoCard).join("") : emptyState("egg", "Nenhum dino cadastrado");
}

function renderNews() {
  const status = $("#newsStatus");
  const grid = $("#newsGrid");
  if (!status || !grid) return;

  const statusLabel =
    newsState.status === "loading"
      ? "Atualizando Paleo.gg"
      : newsState.status === "error"
        ? "Falha ao atualizar"
        : newsState.updatedAt
          ? `Atualizado em ${formatDateTime(newsState.updatedAt)}`
          : "Aguardando atualização";

  status.innerHTML = `
    <div>
      <strong>${escapeHtml(statusLabel)}</strong>
      <span>${escapeHtml(newsState.progress || newsState.message || "")}</span>
    </div>
  `;

  if (!newsState.items.length) {
    grid.innerHTML = emptyState("newspaper", newsState.status === "loading" ? "Buscando últimos dinos..." : "Abra a aba News para atualizar");
    return;
  }

  grid.innerHTML = newsState.items.map(renderNewsCard).join("");
}

function renderNewsCard(item) {
  const image = safeImageUrl(item.imageUrl);
  const price = item.dnaPrice ? `${formatNumber(item.dnaPrice)} DNA` : "Preço indisponível";
  const release = item.releaseDate ? formatDate(item.releaseDate) : "Sem data";
  return `
    <article class="news-card">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy" />` : ""}
      <div class="news-copy">
        <div class="item-title-row">
          <h3>${escapeHtml(item.name)}</h3>
          <span class="tag">${escapeHtml(dinoClassLabels[item.classType] || item.classType)}</span>
          <span class="status-pill">${escapeHtml(dinoRarityLabels[item.rarity] || item.rarity)}</span>
        </div>
        <div class="meta-grid">
          <span>Lançado: ${escapeHtml(release)}</span>
          <span>DNA: ${escapeHtml(price)}</span>
          <span>Ferocidade: ${escapeHtml(formatNumber(item.ferocity))}</span>
        </div>
        <div class="wiki-stat-row">
          <span>Vida 40: ${escapeHtml(formatNumber(item.health40))}</span>
          <span>Dano 40: ${escapeHtml(formatNumber(item.damage40))}</span>
          <span>Moedas/min: ${escapeHtml(formatNumber(item.coinsPerMinute))}</span>
        </div>
        <a class="source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Fonte: Paleo.gg</a>
      </div>
    </article>
  `;
}

function renderGoals() {
  const list = $("#goalList");
  const statusFilter = $("#goalStatusFilter").value;
  const goals = state.goals
    .filter((goal) => {
      if (statusFilter === "active") return !isGoalDone(goal);
      if (statusFilter === "done") return isGoalDone(goal);
      return true;
    })
    .filter((goal) => matchesSearch([goal.title, goal.notes, goal.unit, ...goal.tags]))
    .sort(sortGoals);

  list.innerHTML = goals.length ? goals.map(renderGoalCard).join("") : emptyState("target", "Nenhuma meta cadastrada");
}

function renderTimeline() {
  const list = $("#timelineList");
  const typeFilter = $("#timelineTypeFilter").value;
  const missionFilter = $("#timelineMissionFilter").value;
  const dateFrom = $("#timelineDateFrom").value;
  const dateTo = $("#timelineDateTo").value;
  const sort = $("#timelineSort").value;

  const items = state.timeline
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .filter((item) => missionFilter === "all" || item.missionId === missionFilter)
    .filter((item) => !dateFrom || item.date >= dateFrom)
    .filter((item) => !dateTo || item.date <= dateTo)
    .filter((item) => {
      const mission = item.missionId ? getMission(item.missionId) : null;
      return matchesSearch([item.title, item.description, timelineTypeLabels[item.type], mission?.name, ...item.tags]);
    })
    .sort((a, b) => (sort === "asc" ? (a.date || "").localeCompare(b.date || "") : (b.date || "").localeCompare(a.date || "")));

  list.innerHTML = items.length ? items.map(renderTimelineCard).join("") : emptyState("images", "Nenhum registro encontrado");
}

function renderTimelineMissionOptions() {
  const formSelect = $("#timelineMissionSelect");
  const filterSelect = $("#timelineMissionFilter");
  const galleryMissionSelect = $("#galleryMissionFilter");
  const dinoMissionSelect = $("#dinoMissionSelect");
  const missionDinoSelect = $("#missionDinoSelect");
  const formValue = formSelect.value;
  const filterValue = filterSelect.value;
  const galleryValue = galleryMissionSelect.value;
  const dinoValue = dinoMissionSelect.value;
  const missionDinoValues = getSelectedValues(missionDinoSelect);
  const options = state.missions.map((mission) => `<option value="${escapeHtml(mission.id)}">${escapeHtml(mission.name)}</option>`).join("");
  const dinoOptions = state.dinosaurs
    .map((dino) => `<option value="${escapeHtml(dino.id)}">${escapeHtml(dino.name)} - LV${escapeHtml(dino.currentLevel)}/${escapeHtml(dino.targetLevel)}</option>`)
    .join("");

  formSelect.innerHTML = `<option value="">Sem ligação</option>${options}`;
  filterSelect.innerHTML = `<option value="all">Todas as missões</option>${options}`;
  galleryMissionSelect.innerHTML = `<option value="all">Todas as missões</option>${options}`;
  dinoMissionSelect.innerHTML = `<option value="">Sem ligação</option>${options}`;
  missionDinoSelect.innerHTML = dinoOptions || `<option disabled>Nenhum dino cadastrado</option>`;
  formSelect.value = state.missions.some((mission) => mission.id === formValue) ? formValue : "";
  filterSelect.value = state.missions.some((mission) => mission.id === filterValue) ? filterValue : "all";
  galleryMissionSelect.value = state.missions.some((mission) => mission.id === galleryValue) ? galleryValue : "all";
  dinoMissionSelect.value = state.missions.some((mission) => mission.id === dinoValue) ? dinoValue : "";
  setSelectedValues(missionDinoSelect, missionDinoValues);
}

function renderGallery() {
  const typeFilter = $("#galleryTypeFilter").value;
  const missionFilter = $("#galleryMissionFilter").value;
  const tagFilter = normalizeText($("#galleryTagFilter").value);
  const images = state.timeline
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .filter((item) => missionFilter === "all" || item.missionId === missionFilter)
    .filter((item) => !tagFilter || normalizeText((item.tags || []).join(" ")).includes(tagFilter))
    .filter((item) => matchesSearch([item.title, item.description, timelineTypeLabels[item.type], ...(item.tags || [])]))
    .flatMap((item) => getTimelineImages(item).map((image) => ({ item, image })))
    .sort((a, b) => (b.item.date || "").localeCompare(a.item.date || ""));

  $("#galleryGrid").innerHTML = images.length ? images.map(renderGalleryCard).join("") : emptyState("image", "Nenhum print encontrado");
}

function renderTaskCard(task) {
  const done = task.status === "done";
  const description = task.description ? `<p class="item-description">${escapeHtml(task.description)}</p>` : "";
  const dueDate = task.dueDate ? `<span class="tag ${isOverdue(task) ? "tag-danger" : ""}">${escapeHtml(formatDate(task.dueDate))}</span>` : "";
  const recurrence = task.recurrence && task.recurrence !== "none" ? `<span class="tag tag-recurring">${escapeHtml(recurrenceLabels[task.recurrence])}</span>` : "";
  const overdueClass = isOverdue(task) ? "is-overdue" : "";

  return `
    <article class="task-card ${overdueClass}">
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
          ${recurrence}
          ${task.completedAt ? `<span class="status-pill">Concluída ${escapeHtml(formatDateTime(task.completedAt))}</span>` : ""}
        </div>
        ${renderTagRow(task.tags)}
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
  const steps = normalizeMissionSteps(mission);
  const linkedDinos = getMissionLinkedDinos(mission);
  const linkedImages = getLinkedTimelineImages(mission.id);
  const dueDate = mission.dueDate ? `<span class="tag ${isMissionOverdue(mission) ? "tag-danger" : ""}">${escapeHtml(formatDate(mission.dueDate))}</span>` : "";
  const description = mission.description ? `<p class="mission-description">${escapeHtml(mission.description)}</p>` : "";
  const stepList = steps.length
    ? `<ul class="step-list">${steps.map((step, index) => renderMissionStep(mission.id, step, index, steps.length)).join("")}</ul>`
    : `<p class="item-description">Sem etapas</p>`;
  const prints = linkedImages.length
    ? `<div class="linked-print-strip">${linkedImages.slice(0, 6).map(renderLinkedPrint).join("")}</div>`
    : "";
  const dinoList = linkedDinos.length ? `<div class="linked-dino-strip">${linkedDinos.map(renderLinkedDinoPill).join("")}</div>` : "";

  return `
    <article class="mission-card">
      <div class="mission-top">
        <div>
          <div class="item-title-row">
            <h3>${escapeHtml(mission.name)}</h3>
            <span class="status-pill status-${escapeHtml(mission.status)}">${escapeHtml(missionStatusLabels[mission.status] || mission.status)}</span>
            <span class="priority-pill priority-${escapeHtml(mission.priority)}">${escapeHtml(priorityLabels[mission.priority] || mission.priority)}</span>
            <span class="tag">${escapeHtml(categoryLabels[mission.category] || mission.category)}</span>
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
      ${renderTagRow(mission.tags)}
      ${dinoList}
      ${stepList}
      <form class="add-step-form" data-mission-id="${escapeHtml(mission.id)}">
        <input type="text" placeholder="Nova etapa | nota opcional" autocomplete="off" />
        <button class="secondary-button" type="submit" title="Adicionar etapa">
          <i data-lucide="plus"></i>
          <span>Etapa</span>
        </button>
      </form>
      ${prints}
    </article>
  `;
}

function renderMissionStep(missionId, step, index, total) {
  const note = step.note ? `<small>${escapeHtml(step.note)}</small>` : "";
  return `
    <li class="${step.done ? "is-done" : ""}">
      <input type="checkbox" ${step.done ? "checked" : ""} data-action="toggle-step" data-mission-id="${escapeHtml(missionId)}" data-step-id="${escapeHtml(step.id)}" aria-label="Concluir etapa" />
      <div class="step-copy">
        <span>${escapeHtml(step.text)}</span>
        ${note}
      </div>
      <div class="step-actions">
        <button class="icon-button" type="button" data-action="move-step-up" data-mission-id="${escapeHtml(missionId)}" data-step-id="${escapeHtml(step.id)}" title="Subir etapa" ${index === 0 ? "disabled" : ""}>
          <i data-lucide="chevron-up"></i>
        </button>
        <button class="icon-button" type="button" data-action="move-step-down" data-mission-id="${escapeHtml(missionId)}" data-step-id="${escapeHtml(step.id)}" title="Descer etapa" ${index === total - 1 ? "disabled" : ""}>
          <i data-lucide="chevron-down"></i>
        </button>
        <button class="icon-button" type="button" data-action="delete-step" data-mission-id="${escapeHtml(missionId)}" data-step-id="${escapeHtml(step.id)}" title="Apagar etapa">
          <i data-lucide="x"></i>
        </button>
      </div>
    </li>
  `;
}

function renderAgendaItem(item) {
  const sourceClass = item.source ? `source-${item.source}` : "";
  const actions =
    item.source === "calendar"
      ? `<button class="icon-button" type="button" data-action="edit-calendar" data-id="${escapeHtml(item.id)}" title="Editar"><i data-lucide="pencil"></i></button>
         <button class="icon-button" type="button" data-action="delete-calendar" data-id="${escapeHtml(item.id)}" title="Apagar"><i data-lucide="trash-2"></i></button>`
      : "";

  return `
    <article class="agenda-item ${sourceClass}">
      <div class="agenda-date">
        <strong>${escapeHtml(formatDay(item.date))}</strong>
        <span>${escapeHtml(formatMonth(item.date))}</span>
      </div>
      <div class="item-main">
        <div class="item-title-row">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="tag">${escapeHtml(calendarTypeLabels[item.type] || item.type)}</span>
        </div>
        ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ""}
        ${renderTagRow(item.tags)}
      </div>
      <div class="card-actions">${actions}</div>
    </article>
  `;
}

function renderDinoCard(dino) {
  const mission = dino.missionId ? getMission(dino.missionId) : null;
  const linkedMissionNames = [...new Set([mission?.name, ...getDinoMissions(dino.id).map((item) => item.name)].filter(Boolean))];
  const progress = getDinoProgress(dino);
  const image = safeImageUrl(dino.wikiImageUrl);
  const sourceName = getDinoSourceName(dino.wikiUrl, dino.sourceName);
  const copies = normalizeDinoCopies(dino.copies);
  const wikiStats = [
    dino.health40 ? `Vida 40: ${dino.health40}` : "",
    dino.damage40 ? `Dano 40: ${dino.damage40}` : "",
    dino.coinsPerMinute ? `Moedas/min: ${dino.coinsPerMinute}` : "",
  ].filter(Boolean);
  return `
    <article class="dino-card" data-action="open-dino-detail" data-id="${escapeHtml(dino.id)}" tabindex="0" title="Abrir detalhes">
      ${image ? `<img class="dino-image" src="${escapeHtml(image)}" alt="${escapeHtml(dino.name)}" loading="lazy" />` : ""}
      <div class="item-title-row">
        <h3>${escapeHtml(dino.name)}</h3>
        <span class="tag">${escapeHtml(dinoClassLabels[dino.classType] || dino.classType)}</span>
        <span class="status-pill">${escapeHtml(dinoRarityLabels[dino.rarity] || dino.rarity)}</span>
      </div>
      <div class="progress-track" aria-label="Progresso ${progress}%">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="meta-grid">
        <span>Nível ${escapeHtml(dino.currentLevel)} / ${escapeHtml(dino.targetLevel)}</span>
        <span>DNA: ${escapeHtml(formatNumber(dino.dnaNeeded))}</span>
        <span>Comida: ${escapeHtml(formatNumber(dino.foodNeeded))}</span>
      </div>
      ${copies.length ? `<div class="wiki-stat-row">${copies.slice(0, 4).map((copy, index) => `<span>Cópia ${index + 1}: LV${escapeHtml(copy.level)}</span>`).join("")}${copies.length > 4 ? `<span>+${copies.length - 4}</span>` : ""}</div>` : ""}
      ${linkedMissionNames.length ? `<p class="item-description">Missão: ${escapeHtml(linkedMissionNames.join(", "))}</p>` : ""}
      ${dino.parents ? `<p class="item-description">Pais: ${escapeHtml(dino.parents)}</p>` : ""}
      ${dino.hybrids ? `<p class="item-description">Híbridos: ${escapeHtml(dino.hybrids)}</p>` : ""}
      ${wikiStats.length ? `<div class="wiki-stat-row">${wikiStats.map((stat) => `<span>${escapeHtml(stat)}</span>`).join("")}</div>` : ""}
      ${dino.notes ? `<p class="item-description">${escapeHtml(dino.notes)}</p>` : ""}
      ${dino.wikiUrl ? `<a class="source-link" href="${escapeHtml(dino.wikiUrl)}" target="_blank" rel="noreferrer">Fonte: ${escapeHtml(sourceName)}</a>` : ""}
      ${renderTagRow(dino.tags)}
      <div class="card-actions">
        <button class="icon-button" type="button" data-action="edit-dino" data-id="${escapeHtml(dino.id)}" title="Editar">
          <i data-lucide="pencil"></i>
        </button>
        <button class="icon-button" type="button" data-action="delete-dino" data-id="${escapeHtml(dino.id)}" title="Apagar">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function openDinoDetailDialog(dino) {
  if (!dino) return;
  $("#dinoDetailTitle").textContent = dino.name;
  $("#dinoCopyForm").elements.dinoId.value = dino.id;
  $("#dinoCopyForm").elements.level.value = 10;
  renderDinoDetailContent(dino);
  showDialog("#dinoDetailDialog");
}

function renderDinoDetailContent(dino) {
  const content = $("#dinoDetailContent");
  const image = safeImageUrl(dino.wikiImageUrl);
  const copies = normalizeDinoCopies(dino.copies);
  const sourceName = getDinoSourceName(dino.wikiUrl, dino.sourceName);
  const missionNames = getDinoMissions(dino.id).map((mission) => mission.name).join(", ");
  const copyRows = copies.length
    ? copies.map((copy, index) => renderDinoCopyRow(dino.id, copy, index)).join("")
    : `<p class="item-description">Nenhuma cópia cadastrada ainda.</p>`;

  content.innerHTML = `
    <div class="dino-detail-layout">
      <div class="dino-detail-media">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(dino.name)}" />` : `<i data-lucide="egg"></i>`}
      </div>
      <div class="dino-detail-main">
        <div class="item-title-row">
          <span class="tag">${escapeHtml(dinoClassLabels[dino.classType] || dino.classType)}</span>
          <span class="status-pill">${escapeHtml(dinoRarityLabels[dino.rarity] || dino.rarity)}</span>
          ${dino.wikiUrl ? `<a class="source-link" href="${escapeHtml(dino.wikiUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sourceName)}</a>` : ""}
        </div>
        <div class="meta-grid">
          <span>Base DNA: ${escapeHtml(formatNumber(dino.dnaPrice))}</span>
          <span>Atual: LV${escapeHtml(dino.currentLevel)}</span>
          <span>Alvo: LV${escapeHtml(dino.targetLevel)}</span>
          <span>DNA faltante: ${escapeHtml(formatNumber(dino.dnaNeeded))}</span>
          <span>Comida: ${escapeHtml(formatNumber(dino.foodNeeded))}</span>
          <span>Cópias: ${escapeHtml(copies.length)}</span>
        </div>
        <div class="wiki-stat-row">
          ${dino.health40 ? `<span>Vida 40: ${escapeHtml(formatNumber(dino.health40))}</span>` : ""}
          ${dino.damage40 ? `<span>Dano 40: ${escapeHtml(formatNumber(dino.damage40))}</span>` : ""}
          ${dino.coinsPerMinute ? `<span>Moedas/min: ${escapeHtml(formatNumber(dino.coinsPerMinute))}</span>` : ""}
          ${dino.incubationTime ? `<span>Incubação: ${escapeHtml(dino.incubationTime)}</span>` : ""}
        </div>
        ${dino.parents ? `<p class="item-description">Pais: ${escapeHtml(dino.parents)}</p>` : ""}
        ${dino.hybrids ? `<p class="item-description">Híbridos: ${escapeHtml(dino.hybrids)}</p>` : ""}
        ${missionNames ? `<p class="item-description">Missões: ${escapeHtml(missionNames)}</p>` : ""}
        ${dino.notes ? `<p class="item-description">${escapeHtml(dino.notes)}</p>` : ""}
      </div>
    </div>
    <section class="copy-panel">
      <div class="panel-heading">
        <h3>Cópias cadastradas</h3>
      </div>
      <div class="copy-list">${copyRows}</div>
    </section>
  `;
  refreshIcons();
}

function renderDinoCopyRow(dinoId, copy, index) {
  return `
    <div class="copy-row">
      <strong>Cópia ${index + 1}</strong>
      <input data-action="update-dino-copy" data-id="${escapeHtml(dinoId)}" data-copy-id="${escapeHtml(copy.id)}" type="number" min="1" max="40" value="${escapeHtml(copy.level)}" aria-label="Nível da cópia ${index + 1}" />
      <button class="icon-button" type="button" data-action="delete-dino-copy" data-id="${escapeHtml(dinoId)}" data-copy-id="${escapeHtml(copy.id)}" title="Apagar cópia">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `;
}

function renderGoalCard(goal) {
  const progress = getGoalProgress(goal);
  const done = isGoalDone(goal);
  const dueDate = goal.dueDate ? `<span class="tag ${isGoalOverdue(goal) ? "tag-danger" : ""}">${escapeHtml(formatDate(goal.dueDate))}</span>` : "";
  return `
    <article class="goal-card ${done ? "is-complete" : ""}">
      <div class="mission-top">
        <div>
          <div class="item-title-row">
            <h3>${escapeHtml(goal.title)}</h3>
            <span class="status-pill ${done ? "status-done" : "status-doing"}">${done ? "Concluída" : "Ativa"}</span>
            ${dueDate}
          </div>
          ${goal.notes ? `<p class="item-description">${escapeHtml(goal.notes)}</p>` : ""}
        </div>
        <div class="card-actions">
          <button class="icon-button" type="button" data-action="goal-step" data-id="${escapeHtml(goal.id)}" data-amount="1" title="Somar 1">
            <i data-lucide="plus"></i>
          </button>
          <button class="icon-button" type="button" data-action="goal-step" data-id="${escapeHtml(goal.id)}" data-amount="-1" title="Subtrair 1">
            <i data-lucide="minus"></i>
          </button>
          <button class="icon-button" type="button" data-action="edit-goal" data-id="${escapeHtml(goal.id)}" title="Editar">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-button" type="button" data-action="delete-goal" data-id="${escapeHtml(goal.id)}" title="Apagar">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="progress-track" aria-label="Progresso ${progress}%">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="meta-row">
        <span class="tag">${escapeHtml(formatNumber(goal.current))} / ${escapeHtml(formatNumber(goal.target))} ${escapeHtml(goal.unit || "")}</span>
      </div>
      ${renderTagRow(goal.tags)}
    </article>
  `;
}

function renderTimelineCard(item) {
  const mission = item.missionId ? getMission(item.missionId) : null;
  const images = getTimelineImages(item);
  const firstImage = images[0];
  const media = firstImage
    ? `<button class="timeline-media" type="button" data-action="open-image" data-id="${escapeHtml(item.id)}" data-image-id="${escapeHtml(firstImage.id)}"><img src="${escapeHtml(firstImage.url)}" alt="${escapeHtml(item.title)}" loading="lazy" /></button>`
    : `<div class="timeline-media no-image"><i data-lucide="image"></i><span>Registro sem print</span></div>`;
  const thumbs = images.length > 1 ? `<div class="timeline-thumbs">${images.map((image) => renderTimelineThumb(item.id, image)).join("")}</div>` : "";
  const description = item.description ? `<p>${escapeHtml(item.description)}</p>` : "";
  const source = images.some((image) => image.source === "cloudinary") ? "Cloudinary" : images.length ? "Local" : "Sem imagem";
  const sourceClass = source === "Cloudinary" ? "source-cloudinary" : "source-local";
  const copyButton = firstImage
    ? `<button class="icon-button" type="button" data-action="copy-image-url" data-id="${escapeHtml(item.id)}" data-image-id="${escapeHtml(firstImage.id)}" title="Copiar link"><i data-lucide="link"></i></button>`
    : "";

  return `
    <article class="timeline-card">
      <div>
        ${media}
        ${thumbs}
      </div>
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
          ${images.length ? `<span class="status-pill">${images.length} print${images.length > 1 ? "s" : ""}</span>` : ""}
        </div>
        ${renderTagRow(item.tags)}
      </div>
      <div class="card-actions">
        ${copyButton}
        <button class="icon-button" type="button" data-action="edit-timeline" data-id="${escapeHtml(item.id)}" title="Editar">
          <i data-lucide="pencil"></i>
        </button>
        ${images.length ? `<button class="icon-button" type="button" data-action="delete-timeline-image" data-id="${escapeHtml(item.id)}" data-image-id="${escapeHtml(firstImage.id)}" title="Remover print principal"><i data-lucide="image-off"></i></button>` : ""}
        <button class="icon-button" type="button" data-action="delete-timeline" data-id="${escapeHtml(item.id)}" title="Apagar">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function renderGalleryCard(entry) {
  const mission = entry.item.missionId ? getMission(entry.item.missionId) : null;
  return `
    <article class="gallery-card">
      <button type="button" class="gallery-media" data-action="open-image" data-id="${escapeHtml(entry.item.id)}" data-image-id="${escapeHtml(entry.image.id)}">
        <img src="${escapeHtml(entry.image.url)}" alt="${escapeHtml(entry.item.title)}" loading="lazy" />
      </button>
      <div class="gallery-copy">
        <h3>${escapeHtml(entry.item.title)}</h3>
        <div class="meta-row">
          <span class="tag">${escapeHtml(timelineTypeLabels[entry.item.type] || entry.item.type)}</span>
          <span class="status-pill">${escapeHtml(formatDate(entry.item.date))}</span>
          ${mission ? `<span class="tag">${escapeHtml(mission.name)}</span>` : ""}
        </div>
        ${renderTagRow(entry.item.tags)}
      </div>
    </article>
  `;
}

function renderTimelineThumb(itemId, image) {
  return `
    <button type="button" data-action="open-image" data-id="${escapeHtml(itemId)}" data-image-id="${escapeHtml(image.id)}" title="Abrir print">
      <img src="${escapeHtml(image.url)}" alt="" loading="lazy" />
    </button>
  `;
}

function renderLinkedPrint(entry) {
  return `
    <button type="button" data-action="open-image" data-id="${escapeHtml(entry.item.id)}" data-image-id="${escapeHtml(entry.image.id)}" title="${escapeHtml(entry.item.title)}">
      <img src="${escapeHtml(entry.image.url)}" alt="" loading="lazy" />
    </button>
  `;
}

function renderCompactTask(task) {
  const date = task.dueDate ? ` · ${formatDate(task.dueDate)}` : "";
  const recurrence = task.recurrence !== "none" ? ` · ${recurrenceLabels[task.recurrence]}` : "";
  return `
    <article class="compact-item ${isOverdue(task) ? "is-overdue" : ""}">
      <strong>${escapeHtml(task.title)}</strong>
      <span>${escapeHtml(categoryLabels[task.category] || task.category)} · ${escapeHtml(priorityLabels[task.priority] || task.priority)}${escapeHtml(date)}${escapeHtml(recurrence)}</span>
    </article>
  `;
}

function renderCompactMission(mission) {
  return `
    <article class="compact-item">
      <strong>${escapeHtml(mission.name)}</strong>
      <span>${getMissionProgress(mission)}% · ${escapeHtml(missionStatusLabels[mission.status] || mission.status)} · ${escapeHtml(priorityLabels[mission.priority] || mission.priority)}</span>
    </article>
  `;
}

function renderInsight(insight) {
  return `
    <article class="compact-item insight-item">
      <strong>${escapeHtml(insight.title)}</strong>
      <span>${escapeHtml(insight.detail)}</span>
    </article>
  `;
}

function renderMiniPrint(entry) {
  return `
    <button class="mini-print" type="button" data-action="open-image" data-id="${escapeHtml(entry.item.id)}" data-image-id="${escapeHtml(entry.image.id)}" title="${escapeHtml(entry.item.title)}">
      <img src="${escapeHtml(entry.image.url)}" alt="${escapeHtml(entry.item.title)}" loading="lazy" />
    </button>
  `;
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
    dueDate: formData.get("recurrence") === "none" ? "" : todayIso(),
    recurrence: formData.get("recurrence") || "none",
    completedAt: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  event.currentTarget.reset();
  saveAndRender("Tarefa adicionada.");
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const existing = getTask(id);
  const task = {
    id,
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "pending",
    priority: data.priority || "medium",
    category: data.category || "other",
    dueDate: data.dueDate || "",
    recurrence: data.recurrence || "none",
    tags: parseTags(data.tags),
    completedAt: data.status === "done" ? existing?.completedAt || new Date().toISOString() : "",
    createdAt: existing?.createdAt || new Date().toISOString(),
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
    .map((line) => parseStepLine(line.trim()))
    .filter((step) => step.text)
    .map((step, index) => {
      const previous = existing?.steps?.find((oldStep) => normalizeText(oldStep.text) === normalizeText(step.text));
      return {
        id: previous?.id || createId(),
        text: step.text,
        note: step.note,
        done: Boolean(previous?.done),
        order: index,
      };
    });

  const mission = {
    id,
    name: stripText(data.name),
    description: String(data.description || "").trim(),
    status: data.status || "planned",
    priority: data.priority || "medium",
    category: data.category || "other",
    dueDate: data.dueDate || "",
    steps,
    dinoIds: getSelectedValues(form.elements.dinoIds),
    tags: parseTags(data.tags),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: existing?.completedAt || "",
  };

  if (!mission.name) return;
  const wasRequestedDone = data.status === "done";
  autoUpdateMissionStatus(mission, data.status);

  const index = state.missions.findIndex((item) => item.id === id);
  if (index >= 0) state.missions[index] = mission;
  else state.missions.unshift(mission);

  $("#missionDialog").close();
  saveAndRender(!wasRequestedDone && mission.status === "done" ? `Missão salva e concluída: ${mission.name}.` : "Missão salva.");
}

function handleCalendarSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const existing = getCalendarEvent(id);
  const item = {
    id,
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    type: data.type || "game-event",
    date: data.date || todayIso(),
    tags: parseTags(data.tags),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!item.title) return;

  const index = state.calendarEvents.findIndex((eventItem) => eventItem.id === id);
  if (index >= 0) state.calendarEvents[index] = item;
  else state.calendarEvents.unshift(item);

  $("#calendarDialog").close();
  saveAndRender("Evento salvo.");
}

function handleDinoSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const existing = getDino(id);
  const resources = calculateDinoResourcesFromForm(form);
  const dino = {
    id,
    name: stripText(data.name) || "Dino sem nome",
    classType: data.classType || "carnivore",
    rarity: data.rarity || "common",
    currentLevel: clampNumber(data.currentLevel, 1, 40, 1),
    targetLevel: clampNumber(data.targetLevel, 1, 40, 40),
    dnaPrice: resources.dnaPrice,
    foodCosts: resources.foodCosts,
    dnaNeeded: resources.hasDnaPrice ? resources.dnaNeeded : Math.max(0, toNumber(data.dnaNeeded, existing?.dnaNeeded || 0)),
    foodNeeded: resources.hasFoodCosts ? resources.foodNeeded : Math.max(0, toNumber(data.foodNeeded, existing?.foodNeeded || 0)),
    missionId: data.missionId || "",
    notes: String(data.notes || "").trim(),
    wikiTitle: String(data.wikiTitle || "").trim(),
    wikiUrl: String(data.wikiUrl || "").trim(),
    wikiImageUrl: safeImageUrl(data.wikiImageUrl) || "",
    sourceName: String(data.sourceName || "").trim() || getDinoSourceName(data.wikiUrl),
    wikiClass: String(data.wikiClass || "").trim(),
    wikiRarity: String(data.wikiRarity || "").trim(),
    incubationTime: String(data.incubationTime || "").trim(),
    parents: String(data.parents || "").trim(),
    hybrids: String(data.hybrids || "").trim(),
    health40: String(data.health40 || "").trim(),
    damage40: String(data.damage40 || "").trim(),
    coinsPerMinute: String(data.coinsPerMinute || "").trim(),
    copies: normalizeDinoCopies(existing?.copies),
    tags: parseTags(data.tags),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!dino.name) return;
  if (dino.copies.length) refreshDinoFromCopies(dino);

  const index = state.dinosaurs.findIndex((item) => item.id === id);
  if (index >= 0) state.dinosaurs[index] = dino;
  else state.dinosaurs.unshift(dino);
  const completedMissionNames = syncDinoMissions();

  $("#dinoDialog").close();
  saveAndRender(completedMissionNames.length ? `Dino salvo. Missão concluída: ${completedMissionNames.join(", ")}.` : "Dino salvo.");
}

function handleDinoCopySubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const dino = getDino(form.elements.dinoId.value);
  if (!dino) return;

  dino.copies = [
    ...normalizeDinoCopies(dino.copies),
    {
      id: createId(),
      level: clampNumber(form.elements.level.value, 1, 40, 10),
      createdAt: new Date().toISOString(),
    },
  ];
  refreshDinoFromCopies(dino);
  dino.updatedAt = new Date().toISOString();
  const completedMissionNames = syncDinoMissions();
  saveState();
  renderAll();
  renderDinoDetailContent(dino);
  form.elements.level.value = 10;
  showToast(completedMissionNames.length ? `Cópia adicionada. Missão concluída: ${completedMissionNames.join(", ")}.` : "Cópia adicionada.");
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const existing = getGoal(id);
  const target = Math.max(1, toNumber(data.target, 1));
  const current = Math.max(0, toNumber(data.current, 0));
  const goal = {
    id,
    title: String(data.title || "").trim(),
    current,
    target,
    unit: String(data.unit || "").trim(),
    dueDate: data.dueDate || "",
    notes: String(data.notes || "").trim(),
    tags: parseTags(data.tags),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: current >= target ? existing?.completedAt || new Date().toISOString() : "",
  };

  if (!goal.title) return;

  const index = state.goals.findIndex((item) => item.id === id);
  if (index >= 0) state.goals[index] = goal;
  else state.goals.unshift(goal);

  $("#goalDialog").close();
  saveAndRender("Meta salva.");
}

async function handleTimelineSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || createId();
  const existing = getTimelineItem(id);
  const title = String(data.title || "").trim();
  const files = Array.from($("#timelineImage").files || []);
  if (!title) return;

  const button = $("#saveTimelineButton");
  const label = button.querySelector("span");
  const previousLabel = label.textContent;
  let saved = false;
  button.disabled = true;
  label.textContent = files.length ? "Enviando" : "Salvando";

  try {
    const uploadedImages = files.length ? await saveTimelineImages(files) : [];
    const existingImages = existing ? getTimelineImages(existing) : [];
    const imageMode = data.imageMode || "append";
    const images = existing && uploadedImages.length && imageMode === "replace" ? uploadedImages : [...existingImages, ...uploadedImages];

    const item = {
      id,
      title,
      description: String(data.description || "").trim(),
      type: data.type || "achievement",
      date: data.date || todayIso(),
      missionId: data.missionId || "",
      taskId: existing?.taskId || "",
      tags: parseTags(data.tags),
      images,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const index = state.timeline.findIndex((entry) => entry.id === id);
    if (index >= 0) state.timeline[index] = item;
    else state.timeline.unshift(item);

    resetTimelineForm();
    saved = true;
    saveAndRender(uploadedImages.some((image) => image.source === "cloudinary") ? "Registro salvo com print no Cloudinary." : "Registro salvo.");
  } catch (error) {
    console.error(error);
    showToast("Não consegui salvar esse registro.");
  } finally {
    button.disabled = false;
    label.textContent = saved ? "Salvar registro" : previousLabel;
    refreshIcons();
  }
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  saveSettingsFromForm();
  if (!isCloudinaryReady()) {
    state.settings.cloudinaryStatus = "not-configured";
    state.settings.cloudinaryMessage = "Preencha Cloud name e Upload preset para ativar o envio.";
  } else if (state.settings.cloudinaryStatus !== "ready") {
    state.settings.cloudinaryStatus = "not-configured";
    state.settings.cloudinaryMessage = "Configuração salva. Use o teste para confirmar.";
  }
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
  form.elements.recurrence.value = task?.recurrence || "none";
  form.elements.tags.value = formTagsValue(task?.tags);
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
  form.elements.priority.value = mission?.priority || "medium";
  form.elements.category.value = mission?.category || "dino";
  form.elements.dueDate.value = mission?.dueDate || "";
  form.elements.steps.value = normalizeMissionSteps(mission || { steps: [] })
    .map((step) => (step.note ? `${step.text} | ${step.note}` : step.text))
    .join("\n");
  setSelectedValues(form.elements.dinoIds, normalizeMissionDinoIds(mission?.dinoIds));
  form.elements.tags.value = formTagsValue(mission?.tags);
  showDialog("#missionDialog");
}

function openCalendarDialog(item = null) {
  const form = $("#calendarForm");
  form.reset();
  $("#calendarDialogTitle").textContent = item ? "Editar evento" : "Novo evento";
  form.elements.id.value = item?.id || "";
  form.elements.title.value = item?.title || "";
  form.elements.description.value = item?.description || "";
  form.elements.type.value = item?.type || "game-event";
  form.elements.date.value = item?.date || todayIso();
  form.elements.tags.value = formTagsValue(item?.tags);
  showDialog("#calendarDialog");
}

function openDinoDialog(dino = null) {
  renderTimelineMissionOptions();
  const form = $("#dinoForm");
  form.reset();
  $("#dinoDialogTitle").textContent = dino ? "Editar dino" : "Novo dino";
  form.elements.id.value = dino?.id || "";
  form.elements.name.value = dino?.name || "";
  form.elements.classType.value = dino?.classType || "carnivore";
  form.elements.rarity.value = dino?.rarity || "common";
  form.elements.currentLevel.value = dino?.currentLevel || 1;
  form.elements.targetLevel.value = dino?.targetLevel || 40;
  form.elements.dnaPrice.value = dino?.dnaPrice || (dino?.wikiTitle ? dino?.dnaNeeded : 0) || 0;
  form.elements.foodCosts.value = serializeDinoFoodCosts(dino?.foodCosts);
  form.elements.dnaNeeded.value = dino?.dnaNeeded || 0;
  form.elements.foodNeeded.value = dino?.foodNeeded || 0;
  form.elements.missionId.value = dino?.missionId || "";
  form.elements.notes.value = dino?.notes || "";
  form.elements.tags.value = formTagsValue(dino?.tags);
  form.elements.wikiTitle.value = dino?.wikiTitle || "";
  form.elements.wikiUrl.value = dino?.wikiUrl || "";
  form.elements.wikiImageUrl.value = dino?.wikiImageUrl || "";
  form.elements.sourceName.value = dino?.sourceName || getDinoSourceName(dino?.wikiUrl);
  form.elements.dataSource.value = dino?.wikiUrl?.includes("paleo.gg") ? "paleo" : "fandom";
  form.elements.wikiClass.value = dino?.wikiClass || "";
  form.elements.wikiRarity.value = dino?.wikiRarity || "";
  form.elements.incubationTime.value = dino?.incubationTime || "";
  form.elements.parents.value = dino?.parents || "";
  form.elements.hybrids.value = dino?.hybrids || "";
  form.elements.health40.value = dino?.health40 || "";
  form.elements.damage40.value = dino?.damage40 || "";
  form.elements.coinsPerMinute.value = dino?.coinsPerMinute || "";
  pendingDinoWikiData = null;
  renderDinoWikiResult(dino?.wikiTitle ? getDinoWikiDataFromDino(dino) : null, { applied: Boolean(dino?.wikiTitle) });
  updateDinoResourceFields(form);
  showDialog("#dinoDialog");
}

function openGoalDialog(goal = null) {
  const form = $("#goalForm");
  form.reset();
  $("#goalDialogTitle").textContent = goal ? "Editar meta" : "Nova meta";
  form.elements.id.value = goal?.id || "";
  form.elements.title.value = goal?.title || "";
  form.elements.current.value = goal?.current || 0;
  form.elements.target.value = goal?.target || 1;
  form.elements.unit.value = goal?.unit || "";
  form.elements.dueDate.value = goal?.dueDate || todayIso();
  form.elements.notes.value = goal?.notes || "";
  form.elements.tags.value = formTagsValue(goal?.tags);
  showDialog("#goalDialog");
}

async function fetchDinoWikiFromForm() {
  const form = $("#dinoForm");
  const name = form.elements.name.value.trim();
  if (!name) {
    renderDinoWikiMessage("Digite o nome do dino antes de buscar.", true);
    return;
  }

  const button = $("#fetchDinoWikiButton");
  const label = button.querySelector("span");
  const oldLabel = label.textContent;
  const source = form.elements.dataSource.value || "fandom";
  const sourceLabel = source === "paleo" ? PALEO_SOURCE_NAME : DINO_WIKI_SOURCE_NAME;
  button.disabled = true;
  label.textContent = "Buscando";
  renderDinoWikiMessage(`Buscando em ${sourceLabel}...`);

  try {
    pendingDinoWikiData = source === "paleo" ? await fetchDinoPaleoData(name) : await fetchDinoWikiData(name);
    pendingDinoWikiData = await translateDinoSourceData(pendingDinoWikiData);
    renderDinoWikiResult(pendingDinoWikiData);
  } catch (error) {
    console.error(error);
    pendingDinoWikiData = null;
    renderDinoWikiMessage(error.message || "Não encontrei esse dino na wiki.", true);
  } finally {
    button.disabled = false;
    label.textContent = oldLabel;
    refreshIcons();
  }
}

async function fetchDinoWikiData(name) {
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: name,
    format: "json",
    origin: "*",
  });
  const searchPayload = await fetchJson(`${DINO_WIKI_API}?${searchParams}`);
  const hit = chooseDinoWikiHit(searchPayload?.query?.search || [], name);
  if (!hit) throw new Error("Não encontrei uma página de criatura com esse nome.");

  const parseParams = new URLSearchParams({
    action: "parse",
    page: hit.title,
    prop: "text|displaytitle",
    format: "json",
    origin: "*",
  });
  const pagePayload = await fetchJson(`${DINO_WIKI_API}?${parseParams}`);
  const html = pagePayload?.parse?.text?.["*"];
  if (!html) throw new Error("A wiki respondeu, mas não trouxe os dados da página.");
  return extractDinoWikiData(html, pagePayload.parse.title || hit.title, pagePayload.parse.displaytitle || hit.title);
}

async function fetchDinoPaleoData(name) {
  const slug = toPaleoCreatureSlug(name);
  const detailHtml = await fetchText(`${PALEO_CREATURES_URL}/${encodeURIComponent(slug)}`, PALEO_SOURCE_NAME);
  const detailData = parseNextData(detailHtml);
  const detail = detailData?.props?.pageProps?.detail;
  if (!detail) throw new Error("O Paleo.gg respondeu, mas nao trouxe a ficha da criatura. Use o nome completo do dino no jogo.");

  const foodCosts = await tryFetchDinoWikiFoodCosts(detail.name || name);
  return extractDinoPaleoData(detail, { uuid: slug, name }, foodCosts);
}

async function loadPaleoNews({ force = false } = {}) {
  if (newsState.status === "loading") return;
  const cached = readPaleoNewsCache();
  if (cached?.items?.length) {
    newsState = {
      status: "ready",
      items: cached.items,
      updatedAt: cached.updatedAt,
      message: "Dados carregados do cache enquanto o Paleo.gg é checado.",
      progress: "",
    };
    renderNews();
  }

  newsState = {
    ...newsState,
    status: "loading",
    message: "Checando atualizações do Paleo.gg...",
    progress: "",
  };
  renderNews();

  try {
    const buildId = await fetchPaleoBuildId();
    if (cached?.buildId === buildId && cached?.items?.length) {
      newsState = {
        status: "ready",
        items: cached.items,
        updatedAt: cached.updatedAt,
        message: "Paleo.gg sem mudanças desde o último cache.",
        progress: "",
      };
      renderNews();
      return;
    }

    const listData = await fetchPaleoCreatureListData(buildId);
    const items = listData?.pageProps?.dex?.items || [];
    const detailed = await fetchPaleoNewsDetails(items, buildId);
    const newsItems = detailed
      .filter((item) => item.releaseDate)
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
      .slice(0, 12);

    newsState = {
      status: "ready",
      items: newsItems,
      updatedAt: new Date().toISOString(),
      message: `${newsItems.length} dinos recentes carregados do Paleo.gg.`,
      progress: "",
    };
    writePaleoNewsCache({ buildId, ...newsState });
    renderNews();
    refreshIcons();
  } catch (error) {
    console.error(error);
    newsState = {
      ...newsState,
      status: "error",
      message: error.message || "Não foi possível atualizar a News agora.",
      progress: "",
    };
    renderNews();
    refreshIcons();
  }
}

async function fetchPaleoBuildId() {
  const html = await fetchText(`${PALEO_CREATURES_URL}/${PALEO_NEWS_SEED}`, PALEO_SOURCE_NAME);
  const match = html.match(/"buildId":"([^"]+)"/);
  if (!match) throw new Error("Não consegui identificar a versão atual do Paleo.gg.");
  return match[1];
}

async function fetchPaleoCreatureListData(buildId) {
  const url = `${PALEO_NEXT_DATA_BASE}/${encodeURIComponent(buildId)}/en/games/jurassic-world-the-game/creatures.json`;
  try {
    return await fetchJson(url, PALEO_SOURCE_NAME);
  } catch {
    const mirrored = await fetchText(`${JINA_READER_PREFIX}${url}`, "Espelho do Paleo.gg");
    return parseJsonFromReaderText(mirrored);
  }
}

async function fetchPaleoNewsDetails(items, buildId) {
  const candidates = items.filter((item) => item?.uuid).slice();
  const results = [];
  let index = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (index < candidates.length) {
      const item = candidates[index];
      index += 1;
      if (index % 24 === 0 || index === candidates.length) {
        newsState = {
          ...newsState,
          progress: `Lendo fichas ${Math.min(index, candidates.length)}/${candidates.length}`,
        };
        renderNews();
      }
      try {
        const detail = await fetchPaleoDetailData(item.uuid, buildId);
        results.push(formatPaleoNewsItem(detail?.pageProps?.detail, item));
      } catch {
        results.push(formatPaleoNewsItem(null, item));
      }
    }
  });
  await Promise.all(workers);
  return results.filter(Boolean);
}

async function fetchPaleoDetailData(uuid, buildId) {
  const url = `${PALEO_NEXT_DATA_BASE}/${encodeURIComponent(buildId)}/en/games/jurassic-world-the-game/creatures/${encodeURIComponent(uuid)}.json`;
  return fetchJson(url, PALEO_SOURCE_NAME);
}

async function fetchJson(url, sourceName = "wiki") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${sourceName} recusou a busca agora. Tente novamente em alguns segundos.`);
  return response.json();
}

async function fetchText(url, sourceName = "fonte") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${sourceName} recusou a busca agora. Tente novamente em alguns segundos.`);
  return response.text();
}

async function tryFetchDinoWikiFoodCosts(name) {
  try {
    const wikiData = await fetchDinoWikiData(name);
    return wikiData.foodCosts || {};
  } catch {
    return {};
  }
}

async function translateDinoSourceData(data) {
  if (!data?.description) return data;
  const translated = await translateTextToPortuguese(data.description);
  return {
    ...data,
    description: translated || data.description,
  };
}

async function translateTextToPortuguese(text) {
  const clean = stripText(text);
  if (!clean || normalizeText(clean).length < 12 || looksPortuguese(clean)) return clean;
  const cache = readTranslationCache();
  const key = normalizeText(clean).slice(0, 180);
  if (cache[key]) return cache[key];

  try {
    const params = new URLSearchParams({
      q: clean.slice(0, 480),
      langpair: "en|pt-BR",
    });
    const payload = await fetchJson(`${TRANSLATION_API}?${params}`, "Tradução");
    const translated = stripText(payload?.responseData?.translatedText);
    if (translated) {
      cache[key] = translated;
      writeTranslationCache(cache);
      return translated;
    }
  } catch (error) {
    console.warn("Tradução ignorada.", error);
  }
  return clean;
}

function readTranslationCache() {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeTranslationCache(cache) {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Cache de tradução ignorado.", error);
  }
}

function looksPortuguese(text) {
  return /\b(que|com|para|uma|um|dos|das|nível|dinossauro|missão)\b/i.test(text);
}

function parseNextData(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const raw = doc.querySelector("#__NEXT_DATA__")?.textContent;
  if (!raw) throw new Error("A fonte respondeu, mas nao trouxe dados estruturados.");
  return JSON.parse(raw);
}

function parseJsonFromReaderText(text) {
  const start = text.indexOf('{"pageProps"');
  if (start < 0) throw new Error("O espelho respondeu, mas nao trouxe a lista do Paleo.gg.");
  return JSON.parse(text.slice(start).trim());
}

function chooseDinoWikiHit(results, name) {
  const query = normalizeText(name);
  const exact = results.find((result) => normalizeText(result.title) === query);
  if (exact) return exact;
  return results.find((result) => !/pack|event|category|template/i.test(result.title)) || results[0];
}

function toPaleoCreatureSlug(name) {
  return normalizeText(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function extractDinoWikiData(html, title, displayTitle) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const wikiClass = readPiField(doc, "class");
  const wikiRarity = readPiField(doc, "rarity");
  const buyPriceText = readPiField(doc, "buyprice", true);
  const imageUrl = normalizeWikiImageUrl(doc.querySelector(".pi-image img, aside img")?.getAttribute("src") || "");
  const parents = readPiField(doc, "parents");
  const hybrids = readPiField(doc, "hybrid") || readPiField(doc, "hybrids");
  const description = extractDinoDescription(doc);
  const dnaPrice = /lp/i.test(buyPriceText) ? 0 : extractFirstNumber(buyPriceText);
  const foodCosts = extractDinoFoodCosts(doc);

  const data = {
    title: stripText(displayTitle || title),
    pageTitle: title,
    wikiUrl: `${DINO_WIKI_BASE}${encodeURIComponent(title.replaceAll(" ", "_"))}`,
    sourceName: DINO_WIKI_SOURCE_NAME,
    imageUrl,
    wikiClass,
    classType: mapWikiClass(wikiClass),
    wikiRarity,
    rarity: mapWikiRarity(wikiRarity),
    incubationTime: readPiField(doc, "incubation"),
    parents,
    hybrids,
    buyPriceText,
    dnaPrice,
    foodCosts,
    health40: readPiField(doc, "health"),
    damage40: readPiField(doc, "damage"),
    coinsPerMinute: readPiField(doc, "coins"),
    description,
    tags: normalizeTags([wikiClass, wikiRarity, parents ? "híbrido" : "", hybrids ? "fusão" : ""]),
  };

  if (!data.wikiClass && !data.wikiRarity && !data.health40) {
    throw new Error("Encontrei a página, mas ela não parece ter a ficha de criatura do jogo.");
  }

  return data;
}

function extractDinoPaleoData(detail, hit, foodCosts = {}) {
  const title = formatPaleoName(detail.name || hit.name || detail.uuid);
  const wikiClass = formatPaleoLabel(detail.class || detail.region);
  const wikiRarity = formatPaleoLabel(detail.rarity);
  const parents = formatPaleoCreatures(detail.ingredients, true);
  const hybrids = formatPaleoCreatures(detail.hybrids);
  const facts = Array.isArray(detail.facts) ? detail.facts.map(stripText).filter(Boolean) : [];
  const description = facts[0] ? `${facts[0].slice(0, 320)}${facts[0].length > 320 ? "..." : ""}` : "";
  const dnaPrice = Math.max(0, toNumber(detail.dna_buy, getPaleoDnaPrice(hit)));

  return {
    title,
    pageTitle: detail.uuid || hit.uuid,
    wikiUrl: `${PALEO_CREATURES_URL}/${encodeURIComponent(detail.uuid || hit.uuid)}`,
    sourceName: PALEO_SOURCE_NAME,
    imageUrl: normalizePaleoImageUrl(detail.uuid || hit.uuid),
    wikiClass,
    classType: mapPaleoClass(detail),
    wikiRarity,
    rarity: mapPaleoRarity(detail.rarity),
    incubationTime: formatPaleoDuration(detail.hatch_time),
    parents,
    hybrids,
    buyPriceText: dnaPrice ? `${formatNumber(dnaPrice)} DNA` : "",
    dnaPrice,
    foodCosts,
    health40: detail.health || "",
    damage40: detail.damage || "",
    coinsPerMinute: detail.coin_rate || "",
    description,
    tags: normalizeTags([wikiClass, wikiRarity, parents ? "hibrido" : "", hybrids ? "fusao" : "", "paleo.gg"]),
  };
}

function formatPaleoNewsItem(detail, listItem = {}) {
  const source = detail || listItem;
  if (!source?.uuid) return null;
  const dnaPrice = Math.max(0, toNumber(source.dna_buy, getPaleoDnaPrice(source)));
  return {
    uuid: source.uuid,
    name: formatPaleoName(source.name || source.uuid),
    classType: mapPaleoClass(source),
    rarity: mapPaleoRarity(source.rarity),
    releaseDate: source.release_date || "",
    dnaPrice,
    health40: source.health || 0,
    damage40: source.damage || 0,
    ferocity: source.ferocity || 0,
    coinsPerMinute: source.coin_rate || 0,
    imageUrl: normalizePaleoImageUrl(source.uuid),
    url: `${PALEO_CREATURES_URL}/${encodeURIComponent(source.uuid)}`,
  };
}

function readPiField(doc, source, includeImageAlt = false) {
  const node = doc.querySelector(`[data-source="${source}"] .pi-data-value`);
  if (!node) return "";
  const clone = node.cloneNode(true);
  if (includeImageAlt) {
    clone.querySelectorAll("img").forEach((image) => image.replaceWith(` ${image.alt || ""} `));
  }
  return stripText(clone.textContent);
}

function extractDinoDescription(doc) {
  const paragraphs = Array.from(doc.querySelectorAll("#mw-content-text p, .mw-parser-output > p"))
    .map((paragraph) => stripText(paragraph.textContent))
    .filter((text) => text.length > 80 && !/^this article needs/i.test(text));
  return paragraphs[0] ? `${paragraphs[0].slice(0, 320)}${paragraphs[0].length > 320 ? "..." : ""}` : "";
}

function extractDinoFoodCosts(doc) {
  const table = $$("table", doc).find((item) => {
    const headers = $$("th", item).map((header) => normalizeText(header.textContent));
    return headers.includes("level") && headers.some((header) => header.includes("food"));
  });
  if (!table) return {};

  const costs = {};
  $$("tr", table).forEach((row) => {
    const cells = $$("td", row);
    if (cells.length < 2) return;

    const level = extractFirstNumber(cells[0].textContent);
    if (level < 1 || level > 39) return;

    const foodCell = cells[1];
    const imageText = $$("img", foodCell)
      .map((image) => `${image.alt || ""} ${image.getAttribute("data-image-name") || ""} ${image.getAttribute("data-image-key") || ""}`)
      .join(" ");
    const foodText = stripText(foodCell.textContent);
    if (/s-?dna|dna/i.test(imageText) || /fuse|\//i.test(foodText)) return;

    const cost = extractFirstNumber(foodText);
    if (cost > 0) costs[level] = cost;
  });

  return costs;
}

function updateDinoResourceFields(form = $("#dinoForm")) {
  const resources = calculateDinoResourcesFromForm(form);
  if (resources.hasDnaPrice) form.elements.dnaNeeded.value = resources.dnaNeeded;
  if (resources.hasFoodCosts) form.elements.foodNeeded.value = resources.foodNeeded;
}

function calculateDinoResourcesFromForm(form) {
  return calculateDinoResources({
    currentLevel: form.elements.currentLevel.value,
    targetLevel: form.elements.targetLevel.value,
    dnaPrice: form.elements.dnaPrice.value,
    foodCosts: form.elements.foodCosts.value,
  });
}

function calculateDinoResources(source) {
  const currentLevel = clampNumber(source.currentLevel, 1, 40, 1);
  const targetLevel = clampNumber(source.targetLevel, 1, 40, 40);
  const dnaPrice = Math.max(0, toNumber(source.dnaPrice, 0));
  const foodCosts = normalizeDinoFoodCosts(source.foodCosts);
  const hasDnaPrice = dnaPrice > 0;
  const hasFoodCosts = hasDinoFoodCosts(foodCosts);
  const needsProgress = targetLevel > currentLevel;
  const copiesNeeded = needsProgress ? Math.max(0, getDinoCopiesForLevel(targetLevel) - getDinoCopiesForLevel(currentLevel)) : 0;
  const foodNeeded = needsProgress && hasFoodCosts
    ? Math.max(0, getDinoFoodTotal(targetLevel, foodCosts) - getDinoFoodTotal(currentLevel, foodCosts))
    : 0;

  return {
    currentLevel,
    targetLevel,
    dnaPrice,
    foodCosts,
    hasDnaPrice,
    hasFoodCosts,
    copiesNeeded,
    dnaNeeded: hasDnaPrice ? copiesNeeded * dnaPrice : 0,
    foodNeeded,
  };
}

function getDinoCopiesForLevel(level) {
  if (level >= 31) return 8;
  if (level >= 21) return 4;
  if (level >= 11) return 2;
  return 1;
}

function getDinoFoodTotal(level, foodCosts) {
  const target = clampNumber(level, 1, 40, 1);
  if (target <= 10) return sumDinoFoodRange(foodCosts, 1, target);
  if (target <= 20) return (2 * sumDinoFoodRange(foodCosts, 1, 10)) + sumDinoFoodRange(foodCosts, 11, target);
  if (target <= 30) {
    return (
      (4 * sumDinoFoodRange(foodCosts, 1, 10)) +
      (2 * sumDinoFoodRange(foodCosts, 11, 20)) +
      sumDinoFoodRange(foodCosts, 21, target)
    );
  }
  return (
    (8 * sumDinoFoodRange(foodCosts, 1, 10)) +
    (4 * sumDinoFoodRange(foodCosts, 11, 20)) +
    (2 * sumDinoFoodRange(foodCosts, 21, 30)) +
    sumDinoFoodRange(foodCosts, 31, target)
  );
}

function sumDinoFoodRange(foodCosts, startLevel, targetLevel) {
  let total = 0;
  for (let level = startLevel; level < targetLevel; level += 1) {
    total += Math.max(0, toNumber(foodCosts[level], 0));
  }
  return total;
}

function normalizeDinoFoodCosts(value) {
  let source = value;
  if (typeof source === "string") {
    try {
      source = source ? JSON.parse(source) : {};
    } catch {
      source = {};
    }
  }
  if (!source || typeof source !== "object") return {};

  return Object.entries(source).reduce((costs, [level, cost]) => {
    const normalizedLevel = Number(level);
    const normalizedCost = Math.max(0, toNumber(cost, 0));
    if (Number.isInteger(normalizedLevel) && normalizedLevel >= 1 && normalizedLevel <= 39 && normalizedCost > 0) {
      costs[normalizedLevel] = normalizedCost;
    }
    return costs;
  }, {});
}

function serializeDinoFoodCosts(value) {
  const costs = normalizeDinoFoodCosts(value);
  return hasDinoFoodCosts(costs) ? JSON.stringify(costs) : "";
}

function hasDinoFoodCosts(value) {
  return Object.keys(normalizeDinoFoodCosts(value)).length > 0;
}

function renderDinoWikiResult(data, options = {}) {
  const panel = $("#dinoWikiResult");
  if (!data) {
    panel.classList.add("is-hidden");
    panel.innerHTML = "";
    return;
  }

  const sourceName = getDinoSourceName(data.wikiUrl, data.sourceName);
  const stats = [
    data.wikiClass ? `Classe: ${data.wikiClass}` : "",
    data.wikiRarity ? `Raridade: ${data.wikiRarity}` : "",
    data.dnaPrice ? `Preço: ${formatNumber(data.dnaPrice)} DNA` : data.buyPriceText ? `Preço: ${data.buyPriceText}` : "",
    data.incubationTime ? `Incubação: ${data.incubationTime}` : "",
    hasDinoFoodCosts(data.foodCosts) ? "Comida: tabela carregada" : "",
    data.health40 ? `Vida 40: ${data.health40}` : "",
    data.damage40 ? `Dano 40: ${data.damage40}` : "",
    data.coinsPerMinute ? `Moedas/min: ${data.coinsPerMinute}` : "",
  ].filter(Boolean);

  panel.classList.remove("is-hidden", "is-error");
  panel.innerHTML = `
    <div class="wiki-result-top">
      ${data.imageUrl ? `<img src="${escapeHtml(data.imageUrl)}" alt="${escapeHtml(data.title)}" />` : ""}
      <div>
        <strong>${escapeHtml(data.title)}</strong>
        <span>Fonte: ${escapeHtml(sourceName)}</span>
      </div>
    </div>
    <div class="wiki-chip-list">${stats.map((stat) => `<span>${escapeHtml(stat)}</span>`).join("")}</div>
    ${data.parents ? `<p>Pais: ${escapeHtml(data.parents)}</p>` : ""}
    ${data.hybrids ? `<p>Híbridos: ${escapeHtml(data.hybrids)}</p>` : ""}
    ${data.description ? `<p>${escapeHtml(data.description)}</p>` : ""}
    <div class="action-row">
      <a class="secondary-button" href="${escapeHtml(data.wikiUrl)}" target="_blank" rel="noreferrer">Abrir fonte</a>
      ${
        options.applied
          ? `<span class="status-pill status-done">Dados aplicados</span>`
          : `<button class="primary-button" type="button" data-action="apply-dino-wiki"><i data-lucide="check"></i><span>Aplicar dados</span></button>`
      }
    </div>
  `;
  refreshIcons();
}

function renderDinoWikiMessage(message, isError = false) {
  const panel = $("#dinoWikiResult");
  panel.classList.remove("is-hidden");
  panel.classList.toggle("is-error", isError);
  panel.innerHTML = `<p>${escapeHtml(message)}</p>`;
}

function applyPendingDinoWikiData() {
  if (!pendingDinoWikiData) return;
  applyDinoWikiDataToForm(pendingDinoWikiData);
  renderDinoWikiResult(pendingDinoWikiData, { applied: true });
  showToast("Dados da wiki aplicados.");
}

function applyDinoWikiDataToForm(data) {
  const form = $("#dinoForm");
  form.elements.name.value = data.title || form.elements.name.value;
  if (data.classType) form.elements.classType.value = data.classType;
  if (data.rarity) form.elements.rarity.value = data.rarity;
  form.elements.dnaPrice.value = data.dnaPrice || 0;
  form.elements.foodCosts.value = serializeDinoFoodCosts(data.foodCosts);
  if (!form.elements.notes.value && data.description) form.elements.notes.value = data.description;

  form.elements.wikiTitle.value = data.title || "";
  form.elements.wikiUrl.value = data.wikiUrl || "";
  form.elements.wikiImageUrl.value = data.imageUrl || "";
  form.elements.sourceName.value = data.sourceName || getDinoSourceName(data.wikiUrl);
  form.elements.wikiClass.value = data.wikiClass || "";
  form.elements.wikiRarity.value = data.wikiRarity || "";
  form.elements.incubationTime.value = data.incubationTime || "";
  form.elements.parents.value = data.parents || "";
  form.elements.hybrids.value = data.hybrids || "";
  form.elements.health40.value = data.health40 || "";
  form.elements.damage40.value = data.damage40 || "";
  form.elements.coinsPerMinute.value = data.coinsPerMinute || "";
  form.elements.tags.value = formTagsValue([...parseTags(form.elements.tags.value), ...data.tags]);
  updateDinoResourceFields(form);
}

function getDinoWikiDataFromDino(dino) {
  return {
    title: dino.wikiTitle || dino.name,
    wikiUrl: dino.wikiUrl,
    sourceName: dino.sourceName || getDinoSourceName(dino.wikiUrl),
    imageUrl: dino.wikiImageUrl,
    wikiClass: dino.wikiClass,
    classType: dino.classType,
    wikiRarity: dino.wikiRarity,
    rarity: dino.rarity,
    dnaPrice: dino.dnaPrice,
    foodCosts: dino.foodCosts,
    incubationTime: dino.incubationTime,
    parents: dino.parents,
    hybrids: dino.hybrids,
    health40: dino.health40,
    damage40: dino.damage40,
    coinsPerMinute: dino.coinsPerMinute,
    description: dino.notes,
    tags: dino.tags,
  };
}

function getDinoSourceName(url = "", savedName = "") {
  if (savedName) return savedName;
  if (String(url).includes("paleo.gg")) return PALEO_SOURCE_NAME;
  return DINO_WIKI_SOURCE_NAME;
}

function mapPaleoClass(detail) {
  const region = normalizeText(detail?.region);
  if (region === "aquatic") return "aquatic";
  if (region === "cenozoic") return "cenozoic";
  return mapWikiClass(detail?.class || detail?.region);
}

function mapPaleoRarity(value) {
  const text = normalizeText(value).replace(/\s+/g, "-");
  if (text.includes("super-star")) return "super-star";
  if (text.includes("star")) return "star";
  if (text.includes("boss")) return "boss";
  return mapWikiRarity(value);
}

function getPaleoDnaPrice(hit) {
  const prices = Array.isArray(hit?.price_buy) ? hit.price_buy : [];
  return toNumber(prices.find((price) => price.type === "dna")?.amount, 0);
}

function normalizePaleoImageUrl(uuid) {
  const key = String(uuid || "").trim();
  return key ? `${PALEO_CDN_BASE}/jwtg/images/creature/${encodeURIComponent(key)}.png` : "";
}

function formatPaleoName(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function formatPaleoLabel(value) {
  return formatPaleoName(String(value || "").replace(/-/g, " "));
}

function formatPaleoCreatures(items, includeLevel = false) {
  if (!Array.isArray(items)) return "";
  return items
    .map((item) => {
      const name = formatPaleoName(item.name || item.uuid);
      if (!name) return "";
      return includeLevel && item.amount ? `${name} LV${item.amount}` : name;
    })
    .filter(Boolean)
    .join(includeLevel ? " x " : ", ");
}

function formatPaleoDuration(minutes) {
  const totalMinutes = Math.max(0, toNumber(minutes, 0));
  if (!totalMinutes) return "";
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const remainingMinutes = totalMinutes % 60;
  return [
    days ? `${days}D` : "",
    hours ? `${hours}H` : "",
    remainingMinutes ? `${remainingMinutes}M` : "",
  ].filter(Boolean).join(":");
}

function mapWikiClass(value) {
  const text = normalizeText(value);
  if (text.includes("carnivore")) return "carnivore";
  if (text.includes("herbivore")) return "herbivore";
  if (text.includes("pterosaur")) return "pterosaur";
  if (text.includes("amphibian")) return "amphibian";
  if (/(reef|surface|cave)/.test(text)) return "aquatic";
  if (/(savannah|snow|cavern)/.test(text)) return "cenozoic";
  return "hybrid";
}

function mapWikiRarity(value) {
  const text = normalizeText(value);
  if (text.includes("super star")) return "super-star";
  if (text.includes("star")) return "star";
  if (text.includes("boss")) return "boss";
  if (text.includes("tournament")) return "tournament";
  if (text.includes("vip")) return "vip";
  if (text.includes("super")) return "super-rare";
  if (text.includes("legendary")) return "legendary";
  if (text.includes("rare")) return "rare";
  if (text.includes("common")) return "common";
  return "legendary";
}

function openTimelineForEdit(id) {
  const item = getTimelineItem(id);
  if (!item) return;
  switchView("timeline");
  const form = $("#timelineForm");
  form.reset();
  form.elements.id.value = item.id;
  form.elements.title.value = item.title;
  form.elements.description.value = item.description;
  form.elements.type.value = item.type;
  form.elements.date.value = item.date || todayIso();
  form.elements.missionId.value = item.missionId || "";
  form.elements.imageMode.value = "append";
  form.elements.tags.value = formTagsValue(item.tags);
  $("#timelineFormTitle").textContent = "Editar registro";
  $("#saveTimelineButton span").textContent = "Salvar edição";
  $("#cancelTimelineEdit").classList.remove("is-hidden");
  renderExistingImageStrip(item);
  resetImagePreview(false);
  $(".upload-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  refreshIcons();
}

function resetTimelineForm() {
  const form = $("#timelineForm");
  form.reset();
  form.elements.id.value = "";
  $("#timelineFormTitle").textContent = "Novo registro";
  $("#saveTimelineButton span").textContent = "Salvar registro";
  $("#cancelTimelineEdit").classList.add("is-hidden");
  $("#existingImageStrip").classList.add("is-hidden");
  $("#existingImageStrip").innerHTML = "";
  setTodayOnTimelineForm();
  resetImagePreview();
}

function renderExistingImageStrip(item) {
  const images = getTimelineImages(item);
  const strip = $("#existingImageStrip");
  strip.classList.toggle("is-hidden", images.length === 0);
  strip.innerHTML = images.length
    ? `<span>Prints atuais</span><div>${images
        .map((image) => `<button type="button" data-action="open-image" data-id="${escapeHtml(item.id)}" data-image-id="${escapeHtml(image.id)}"><img src="${escapeHtml(image.url)}" alt="" /></button>`)
        .join("")}</div>`
    : "";
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
  task.completedAt = task.status === "done" ? new Date().toISOString() : "";
  task.updatedAt = new Date().toISOString();
  saveAndRender(task.status === "done" ? "Tarefa concluída." : "Tarefa reaberta.");
}

function resetRecurringTasks() {
  const recurringTasks = state.tasks.filter((task) => task.recurrence && task.recurrence !== "none" && task.status === "done");
  if (!recurringTasks.length) {
    showToast("Nenhuma tarefa recorrente concluída para resetar.");
    return;
  }

  recurringTasks.forEach((task) => {
    task.status = "pending";
    task.completedAt = "";
    task.dueDate = todayIso();
    task.updatedAt = new Date().toISOString();
  });

  saveAndRender(`${recurringTasks.length} tarefa${recurringTasks.length > 1 ? "s" : ""} recorrente${recurringTasks.length > 1 ? "s" : ""} resetada${recurringTasks.length > 1 ? "s" : ""}.`);
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
  state.dinosaurs = state.dinosaurs.map((item) => (item.missionId === id ? { ...item, missionId: "" } : item));
  saveAndRender("Missão apagada.");
}

function deleteCalendarEvent(id) {
  const item = getCalendarEvent(id);
  if (!item || !confirm(`Apagar "${item.title}" do calendário?`)) return;
  state.calendarEvents = state.calendarEvents.filter((eventItem) => eventItem.id !== id);
  saveAndRender("Evento apagado.");
}

function deleteDino(id) {
  const dino = getDino(id);
  if (!dino || !confirm(`Apagar "${dino.name}"?`)) return;
  state.dinosaurs = state.dinosaurs.filter((item) => item.id !== id);
  state.missions = state.missions.map((mission) => ({ ...mission, dinoIds: normalizeMissionDinoIds(mission.dinoIds).filter((dinoId) => dinoId !== id) }));
  saveAndRender("Dino apagado.");
}

function updateDinoCopyLevel(dinoId, copyId, value) {
  const dino = getDino(dinoId);
  if (!dino) return;
  dino.copies = normalizeDinoCopies(dino.copies).map((copy) => (copy.id === copyId ? { ...copy, level: clampNumber(value, 1, 40, copy.level) } : copy));
  refreshDinoFromCopies(dino);
  dino.updatedAt = new Date().toISOString();
  const completedMissionNames = syncDinoMissions();
  saveState();
  renderAll();
  renderDinoDetailContent(dino);
  if (completedMissionNames.length) showToast(`Missão concluída: ${completedMissionNames.join(", ")}.`);
}

function deleteDinoCopy(dinoId, copyId) {
  const dino = getDino(dinoId);
  if (!dino) return;
  dino.copies = normalizeDinoCopies(dino.copies).filter((copy) => copy.id !== copyId);
  refreshDinoFromCopies(dino);
  dino.updatedAt = new Date().toISOString();
  syncDinoMissions();
  saveState();
  renderAll();
  renderDinoDetailContent(dino);
  showToast("Cópia removida.");
}

function deleteGoal(id) {
  const goal = getGoal(id);
  if (!goal || !confirm(`Apagar "${goal.title}"?`)) return;
  state.goals = state.goals.filter((item) => item.id !== id);
  saveAndRender("Meta apagada.");
}

function updateGoalProgress(id, amount) {
  const goal = getGoal(id);
  if (!goal) return;
  goal.current = Math.max(0, Math.min(goal.target, toNumber(goal.current, 0) + amount));
  goal.completedAt = goal.current >= goal.target ? goal.completedAt || new Date().toISOString() : "";
  goal.updatedAt = new Date().toISOString();
  saveAndRender("Meta atualizada.");
}

function addMissionStep(missionId, text, note = "") {
  const mission = getMission(missionId);
  if (!mission) return;
  const order = normalizeMissionSteps(mission).length;
  mission.steps = [...(mission.steps || []), { id: createId(), text, note, done: false, order }];
  if (mission.status === "planned") mission.status = "doing";
  mission.updatedAt = new Date().toISOString();
  saveAndRender("Etapa adicionada.");
}

function toggleMissionStep(missionId, stepId, done) {
  const mission = getMission(missionId);
  const step = mission?.steps?.find((item) => item.id === stepId);
  if (!mission || !step) return;
  step.done = done;
  mission.updatedAt = new Date().toISOString();
  autoUpdateMissionStatus(mission);
  saveAndRender(done ? "Etapa concluída." : "Etapa reaberta.");
}

function deleteMissionStep(missionId, stepId) {
  const mission = getMission(missionId);
  if (!mission) return;
  mission.steps = normalizeMissionSteps(mission)
    .filter((step) => step.id !== stepId)
    .map((step, index) => ({ ...step, order: index }));
  mission.updatedAt = new Date().toISOString();
  autoUpdateMissionStatus(mission);
  saveAndRender("Etapa apagada.");
}

function moveMissionStep(missionId, stepId, direction) {
  const mission = getMission(missionId);
  if (!mission) return;
  const steps = normalizeMissionSteps(mission);
  const index = steps.findIndex((step) => step.id === stepId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= steps.length) return;
  const [step] = steps.splice(index, 1);
  steps.splice(nextIndex, 0, step);
  mission.steps = steps.map((item, order) => ({ ...item, order }));
  mission.updatedAt = new Date().toISOString();
  saveAndRender("Etapas reordenadas.");
}

function deleteTimelineItem(id) {
  const item = getTimelineItem(id);
  if (!item || !confirm(`Apagar "${item.title}" da timeline?`)) return;
  state.timeline = state.timeline.filter((entry) => entry.id !== id);
  saveAndRender("Registro apagado.");
}

function deleteTimelineImage(id, imageId) {
  const item = getTimelineItem(id);
  if (!item) return;
  const image = getTimelineImages(item).find((entry) => entry.id === imageId);
  if (!image || !confirm("Remover este print do registro?")) return;
  item.images = getTimelineImages(item).filter((entry) => entry.id !== imageId);
  item.updatedAt = new Date().toISOString();
  saveAndRender("Print removido.");
}

async function copyImageUrl(id, imageId) {
  const item = getTimelineItem(id);
  const image = getTimelineImages(item).find((entry) => entry.id === imageId) || getTimelineImages(item)[0];
  const imageUrl = safeImageUrl(image?.url);
  if (!imageUrl) return;
  try {
    await navigator.clipboard.writeText(imageUrl);
    showToast("Link copiado.");
  } catch (error) {
    console.warn(error);
    showToast("Não consegui copiar o link.");
  }
}

function openImageViewer(id, imageId) {
  const item = getTimelineItem(id);
  const images = getTimelineImages(item);
  if (!item || !images.length) return;
  const index = Math.max(0, images.findIndex((image) => image.id === imageId));
  viewerState = { itemId: id, imageIndex: index };
  updateImageViewer();
  showDialog("#imageViewerDialog");
}

function moveImageViewer(direction) {
  const item = getTimelineItem(viewerState.itemId);
  const images = getTimelineImages(item);
  if (!images.length) return;
  viewerState.imageIndex = (viewerState.imageIndex + direction + images.length) % images.length;
  updateImageViewer();
}

function updateImageViewer() {
  const item = getTimelineItem(viewerState.itemId);
  const images = getTimelineImages(item);
  const image = images[viewerState.imageIndex];
  if (!item || !image) return;
  $("#imageViewerTitle").textContent = item.title;
  $("#imageViewerImg").src = image.url;
  $("#imageViewerImg").alt = item.title;
  $("#imageViewerCount").textContent = `${viewerState.imageIndex + 1} de ${images.length}`;
  $("#prevImageButton").disabled = images.length < 2;
  $("#nextImageButton").disabled = images.length < 2;
}

async function saveTimelineImages(files) {
  const images = [];
  for (const file of files) {
    images.push(await saveTimelineImage(file));
  }
  return images.filter((image) => image.url);
}

async function saveTimelineImage(file) {
  if (isCloudinaryReady()) {
    try {
      const uploadFile = await resizeImage(file, 1800, 0.9);
      return await uploadToCloudinary(uploadFile);
    } catch (error) {
      console.warn("Upload Cloudinary falhou.", error);
      state.settings.cloudinaryStatus = "error";
      state.settings.cloudinaryMessage = readableCloudinaryError(error);
      showToast("Cloudinary recusou o upload. Salvei o print localmente.");
    }
  }

  const localFile = await resizeImage(file, 1400, 0.82);
  const dimensions = await getImageDimensions(localFile);
  const dataUrl = await blobToDataUrl(localFile);
  return {
    id: createId(),
    url: dataUrl,
    publicId: "",
    source: "local",
    width: dimensions.width,
    height: dimensions.height,
    createdAt: new Date().toISOString(),
  };
}

async function uploadToCloudinary(file, options = {}) {
  const settings = options.settings || state.settings;
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(settings.cloudName)}/image/upload`;
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", settings.uploadPreset);
  if (settings.folder) body.append("folder", options.test ? `${settings.folder}/tests` : settings.folder);
  body.append("tags", options.test ? "jurassic-planner,test" : "jurassic-planner");

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
    id: createId(),
    url: payload.secure_url,
    publicId: payload.public_id,
    source: "cloudinary",
    width: payload.width || 0,
    height: payload.height || 0,
    createdAt: new Date().toISOString(),
  };
}

async function testCloudinary() {
  saveSettingsFromForm();
  const validation = validateCloudinarySettings(state.settings);
  if (validation) {
    state.settings.cloudinaryStatus = "error";
    state.settings.cloudinaryMessage = validation;
    saveAndRender(validation);
    return;
  }

  const button = $("#testCloudinaryButton");
  const label = button.querySelector("span");
  const oldLabel = label.textContent;
  button.disabled = true;
  label.textContent = "Testando";

  try {
    const testFile = await createCloudinaryTestFile();
    await uploadToCloudinary(testFile, { test: true });
    state.settings.cloudinaryStatus = "ready";
    state.settings.cloudinaryMessage = `Teste enviado com sucesso em ${formatDateTime(new Date().toISOString())}.`;
    state.settings.testedAt = new Date().toISOString();
    saveAndRender("Cloudinary testado com sucesso.");
  } catch (error) {
    state.settings.cloudinaryStatus = "error";
    state.settings.cloudinaryMessage = readableCloudinaryError(error);
    saveAndRender(state.settings.cloudinaryMessage);
  } finally {
    button.disabled = false;
    label.textContent = oldLabel;
    refreshIcons();
  }
}

function saveSettingsFromForm() {
  const data = Object.fromEntries(new FormData($("#settingsForm")).entries());
  const previous = state.settings;
  state.settings = {
    ...previous,
    cloudName: String(data.cloudName || "").trim(),
    uploadPreset: String(data.uploadPreset || "").trim(),
    folder: String(data.folder || "").trim() || "jurassic-planner",
  };
}

function validateCloudinarySettings(settings = state.settings) {
  if (!settings.cloudName || !settings.uploadPreset) {
    return "Preencha Cloud name e Upload preset antes de testar.";
  }
  if (/\s/.test(settings.cloudName) || /\s/.test(settings.uploadPreset)) {
    return "Cloud name e Upload preset não podem ter espaços.";
  }
  return "";
}

function readableCloudinaryError(error) {
  const message = String(error?.message || error || "");
  if (message.toLowerCase().includes("upload preset")) return "Upload preset inválido ou não liberado para upload sem assinatura.";
  if (message.toLowerCase().includes("cloud name")) return "Cloud name inválido.";
  if (message.toLowerCase().includes("failed to fetch")) return "Não consegui conectar ao Cloudinary. Confira sua internet.";
  return message || "Cloudinary recusou o upload.";
}

function createCloudinaryTestFile() {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext("2d");
    context.fillStyle = "#101411";
    context.fillRect(0, 0, 24, 24);
    context.fillStyle = "#75d96b";
    context.fillRect(4, 4, 16, 16);
    context.fillStyle = "#5fd7cf";
    context.fillRect(9, 9, 10, 10);
    canvas.toBlob((blob) => resolve(new File([blob], "jurassic-planner-test.png", { type: "image/png" })), "image/png");
  });
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

function getImageDimensions(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const result = { width: image.width, height: image.height };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    image.src = url;
  });
}

function updateImagePreview() {
  const files = Array.from($("#timelineImage").files || []);
  resetImagePreview(false);
  if (!files.length) return;

  previewUrls = files.map((file) => URL.createObjectURL(file));
  $("#imagePreview").innerHTML = `
    <div class="preview-stack">
      ${previewUrls.map((url) => `<img src="${escapeHtml(url)}" alt="Prévia do print" />`).join("")}
    </div>
  `;
}

function resetImagePreview(refresh = true) {
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls = [];
  $("#timelineImage").value = "";
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

function renderCloudinaryStatus() {
  const label = $("#cloudinaryStatusLabel");
  const message = $("#cloudinaryStatusMessage");
  const status = state.settings.cloudinaryStatus || "not-configured";
  label.className = `status-pill cloud-status-${status}`;
  label.textContent = status === "ready" ? "Configurado" : status === "error" ? "Erro no upload" : "Não configurado";
  message.textContent = state.settings.cloudinaryMessage || "Preencha os campos e faça um teste de envio.";
  $("#storageModeText").textContent =
    status === "ready" ? "Dados ficam neste navegador; prints novos podem ir para o Cloudinary." : "Dados e prints sem Cloudinary ficam apenas neste navegador.";
}

function renderBackupStatus() {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_KEY);
    if (!raw) {
      $("#autoBackupText").textContent = "Backup local automático ainda não criado.";
      return;
    }
    const backup = JSON.parse(raw);
    const suffix = backup.skippedImages ? " sem prints locais grandes" : "";
    $("#autoBackupText").textContent = `Backup local automático atualizado em ${formatDateTime(backup.exportedAt)}${suffix}.`;
  } catch {
    $("#autoBackupText").textContent = "Backup local automático indisponível.";
  }
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(getBackupPayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jurassic-planner-backup-${todayIso()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Backup exportado.");
}

function exportTimelineHtml() {
  const items = [...state.timeline].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (!items.length) {
    showToast("Não há registros para exportar.");
    return;
  }

  const body = items
    .map((item) => {
      const images = getTimelineImages(item)
        .map((image) => `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(item.title)}" />`)
        .join("");
      const mission = item.missionId ? getMission(item.missionId) : null;
      return `
        <article>
          <time>${escapeHtml(formatDate(item.date))}</time>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.description || "")}</p>
          <p><strong>Tipo:</strong> ${escapeHtml(timelineTypeLabels[item.type] || item.type)}${mission ? ` · <strong>Missão:</strong> ${escapeHtml(mission.name)}` : ""}</p>
          <p>${normalizeTags(item.tags).map((tag) => `#${escapeHtml(tag)}`).join(" ")}</p>
          <div class="prints">${images}</div>
        </article>
      `;
    })
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Timeline Jurassic Planner</title>
  <style>
    body { margin: 0; padding: 32px; background: #111411; color: #f4f5ef; font-family: Arial, sans-serif; }
    main { max-width: 980px; margin: 0 auto; }
    h1 { margin-bottom: 24px; }
    article { border-left: 3px solid #75d96b; padding: 0 0 28px 18px; margin-bottom: 28px; }
    time { color: #5fd7cf; font-weight: 700; text-transform: uppercase; }
    h2 { margin: 8px 0; }
    p { color: #d4dbc9; line-height: 1.5; }
    .prints { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 12px; }
    img { width: 100%; border-radius: 8px; background: #0d100f; }
  </style>
</head>
<body>
  <main>
    <h1>Timeline Jurassic Planner</h1>
    ${body}
  </main>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jurassic-timeline-${todayIso()}.html`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Timeline exportada em HTML.");
}

function getBackupPayload() {
  return {
    app: "jurassic-planner",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      pendingImportState = hydrateState(JSON.parse(reader.result));
      renderImportPreview(pendingImportState);
      showDialog("#importPreviewDialog");
    } catch (error) {
      console.error(error);
      showToast("Esse arquivo não parece ser um backup válido.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function renderImportPreview(imported) {
  const printCount = imported.timeline.reduce((total, item) => total + getTimelineImages(item).length, 0);
  $("#importPreviewContent").innerHTML = `
    <article class="metric metric-green">
      <span>Tarefas</span>
      <strong>${imported.tasks.length}</strong>
    </article>
    <article class="metric metric-amber">
      <span>Missões</span>
      <strong>${imported.missions.length}</strong>
    </article>
    <article class="metric metric-cyan">
      <span>Registros</span>
      <strong>${imported.timeline.length}</strong>
    </article>
    <article class="metric metric-red">
      <span>Prints</span>
      <strong>${printCount}</strong>
    </article>
    <article class="metric metric-violet">
      <span>Dinos</span>
      <strong>${imported.dinosaurs.length}</strong>
    </article>
    <article class="metric metric-green">
      <span>Metas</span>
      <strong>${imported.goals.length}</strong>
    </article>
  `;
}

function confirmImportBackup() {
  if (!pendingImportState) return;
  state = pendingImportState;
  pendingImportState = null;
  $("#importPreviewDialog").close();
  saveAndRender("Backup importado.");
}

function clearLocalImages() {
  const localCount = state.timeline.reduce(
    (total, item) => total + getTimelineImages(item).filter((image) => image.source === "local" || image.url.startsWith("data:image/")).length,
    0,
  );
  if (!localCount) {
    showToast("Não há prints locais para limpar.");
    return;
  }
  if (!confirm(`Remover ${localCount} print${localCount > 1 ? "s" : ""} local${localCount > 1 ? "is" : ""}? Prints do Cloudinary ficam salvos.`)) return;
  state.timeline.forEach((item) => {
    item.images = getTimelineImages(item).filter((image) => image.source !== "local" && !image.url.startsWith("data:image/"));
    item.updatedAt = new Date().toISOString();
  });
  saveAndRender("Prints locais removidos.");
}

function clearAllData() {
  if (!confirm("Limpar todos os dados deste navegador?")) return;
  state = createEmptyState();
  localStorage.removeItem(AUTO_BACKUP_KEY);
  saveAndRender("Dados limpos.");
}

function getTask(id) {
  return state.tasks.find((task) => task.id === id);
}

function getMission(id) {
  return state.missions.find((mission) => mission.id === id);
}

function getCalendarEvent(id) {
  return state.calendarEvents.find((eventItem) => eventItem.id === id);
}

function getDino(id) {
  return state.dinosaurs.find((dino) => dino.id === id);
}

function getGoal(id) {
  return state.goals.find((goal) => goal.id === id);
}

function getTimelineItem(id) {
  return state.timeline.find((item) => item.id === id);
}

function getTimelineImages(item) {
  return Array.isArray(item?.images) ? item.images.filter((image) => safeImageUrl(image.url)) : [];
}

function getLinkedTimelineImages(missionId) {
  return state.timeline
    .filter((item) => item.missionId === missionId)
    .flatMap((item) => getTimelineImages(item).map((image) => ({ item, image })));
}

function getAgendaItems() {
  const customEvents = state.calendarEvents.map((item) => ({ ...item, source: "calendar" }));
  const taskEvents = state.tasks
    .filter((task) => task.dueDate && task.status !== "done")
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: "task",
      date: task.dueDate,
      tags: task.tags,
      source: "task",
    }));
  const missionEvents = state.missions
    .filter((mission) => mission.dueDate && mission.status !== "done")
    .map((mission) => ({
      id: mission.id,
      title: mission.name,
      description: mission.description,
      type: "mission",
      date: mission.dueDate,
      tags: mission.tags,
      source: "mission",
    }));
  const goalEvents = state.goals
    .filter((goal) => goal.dueDate && !isGoalDone(goal))
    .map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.notes,
      type: "goal",
      date: goal.dueDate,
      tags: goal.tags,
      source: "goal",
    }));
  return [...customEvents, ...taskEvents, ...missionEvents, ...goalEvents];
}

function getSmartInsights() {
  const insights = [];
  const overdueTasks = state.tasks.filter(isOverdue).sort(sortTasks);
  const upcomingAgenda = getAgendaItems()
    .filter((item) => item.date >= todayIso() && item.date <= addDaysIso(7))
    .sort((a, b) => a.date.localeCompare(b.date));
  const closeMissions = state.missions
    .filter((mission) => mission.status !== "done" && getMissionProgress(mission) >= 70)
    .sort((a, b) => getMissionProgress(b) - getMissionProgress(a));
  const closeGoals = state.goals
    .filter((goal) => !isGoalDone(goal) && getGoalProgress(goal) >= 70)
    .sort((a, b) => getGoalProgress(b) - getGoalProgress(a));
  const dinosNearTarget = state.dinosaurs
    .filter((dino) => getDinoProgress(dino) >= 75 && getDinoProgress(dino) < 100)
    .sort((a, b) => getDinoProgress(b) - getDinoProgress(a));

  overdueTasks.slice(0, 2).forEach((task) => insights.push({ title: task.title, detail: `Tarefa atrasada desde ${formatDate(task.dueDate)}` }));
  closeMissions.slice(0, 2).forEach((mission) => insights.push({ title: mission.name, detail: `Missão quase pronta: ${getMissionProgress(mission)}%` }));
  closeGoals.slice(0, 2).forEach((goal) => insights.push({ title: goal.title, detail: `Meta em ${getGoalProgress(goal)}%` }));
  dinosNearTarget.slice(0, 2).forEach((dino) => insights.push({ title: dino.name, detail: `Dino perto do alvo: ${getDinoProgress(dino)}%` }));
  upcomingAgenda.slice(0, 3).forEach((item) => insights.push({ title: item.title, detail: `${calendarTypeLabels[item.type] || item.type} em ${formatDate(item.date)}` }));

  return insights.slice(0, 6);
}

function getMissionProgress(mission) {
  const steps = normalizeMissionSteps(mission);
  const parts = [];
  if (steps.length) parts.push(Math.round((steps.filter((step) => step.done).length / steps.length) * 100));
  if (normalizeMissionDinoIds(mission.dinoIds).length) parts.push(getMissionDinoProgress(mission));
  if (!parts.length) return mission.status === "done" ? 100 : 0;
  return Math.round(parts.reduce((total, value) => total + value, 0) / parts.length);
}

function autoUpdateMissionStatus(mission, requestedStatus = mission.status, options = {}) {
  const steps = normalizeMissionSteps(mission);
  const dinoIds = normalizeMissionDinoIds(mission.dinoIds);
  const dinoProgress = getMissionDinoProgress(mission, options.dinosaurs);
  const stepsDone = !steps.length || steps.every((step) => step.done);
  const dinosDone = !dinoIds.length || dinoProgress === 100;
  if ((steps.length || dinoIds.length) && stepsDone && dinosDone) {
    mission.status = "done";
    mission.completedAt = mission.completedAt || new Date().toISOString();
    return;
  }
  if (requestedStatus === "done" && stepsDone && dinosDone) {
    mission.status = "done";
    mission.completedAt = mission.completedAt || new Date().toISOString();
    return;
  }
  mission.status = requestedStatus === "done" ? "doing" : requestedStatus;
  mission.completedAt = "";
}

function normalizeMissionSteps(mission) {
  return [...(mission?.steps || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function getMissionDinoProgress(mission, dinosaurs = state.dinosaurs) {
  const dinoIds = normalizeMissionDinoIds(mission.dinoIds);
  if (!dinoIds.length) return 0;
  const progresses = dinoIds.map((id) => {
    const dino = dinosaurs.find((item) => item.id === id);
    return dino ? getDinoProgress(dino) : 0;
  });
  return Math.round(progresses.reduce((total, value) => total + value, 0) / progresses.length);
}

function getMissionLinkedDinos(mission) {
  return normalizeMissionDinoIds(mission.dinoIds)
    .map(getDino)
    .filter(Boolean);
}

function getDinoMissions(dinoId) {
  return state.missions.filter((mission) => normalizeMissionDinoIds(mission.dinoIds).includes(dinoId));
}

function renderLinkedDinoPill(dino) {
  const progress = getDinoProgress(dino);
  return `
    <button class="linked-dino-pill" type="button" data-action="open-dino-detail" data-id="${escapeHtml(dino.id)}" title="Abrir dino">
      <span>${escapeHtml(dino.name)}</span>
      <small>LV${escapeHtml(dino.currentLevel)}/${escapeHtml(dino.targetLevel)} · ${escapeHtml(progress)}%</small>
    </button>
  `;
}

function normalizeMissionDinoIds(value) {
  const ids = Array.isArray(value) ? value : value ? [value] : [];
  return ids.map((id) => String(id || "").trim()).filter((id, index, list) => id && list.indexOf(id) === index);
}

function normalizeDinoCopies(value) {
  return (Array.isArray(value) ? value : [])
    .map((copy) => ({
      id: copy.id || createId(),
      level: clampNumber(copy.level, 1, 40, 10),
      createdAt: copy.createdAt || new Date().toISOString(),
    }))
    .sort((a, b) => b.level - a.level || a.createdAt.localeCompare(b.createdAt));
}

function refreshDinoFromCopies(dino) {
  const copies = normalizeDinoCopies(dino.copies);
  dino.copies = copies;
  if (copies.length) dino.currentLevel = Math.max(...copies.map((copy) => copy.level));
  const resources = calculateDinoResources(dino);
  if (resources.hasDnaPrice) dino.dnaNeeded = resources.dnaNeeded;
  if (resources.hasFoodCosts) dino.foodNeeded = resources.foodNeeded;
}

function syncDinoMissions() {
  const completed = [];
  state.missions.forEach((mission) => {
    const wasDone = mission.status === "done";
    autoUpdateMissionStatus(mission, mission.status);
    if (!wasDone && mission.status === "done") completed.push(mission.name);
  });
  return completed;
}

function parseStepLine(line) {
  const [text, ...noteParts] = String(line || "").split("|");
  return {
    text: text.trim(),
    note: noteParts.join("|").trim(),
  };
}

function getSelectedValues(select) {
  return Array.from(select?.selectedOptions || []).map((option) => option.value).filter(Boolean);
}

function setSelectedValues(select, values) {
  const selected = new Set(values || []);
  Array.from(select?.options || []).forEach((option) => {
    option.selected = selected.has(option.value);
  });
}

function parseTags(value) {
  return normalizeTags(
    String(value || "")
      .split(/[,#]/)
      .map((tag) => tag.trim()),
  );
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = normalizeText(tag);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formTagsValue(tags) {
  return normalizeTags(tags).join(", ");
}

function renderTagRow(tags) {
  const cleanTags = normalizeTags(tags);
  if (!cleanTags.length) return "";
  return `<div class="tag-row">${cleanTags.map((tag) => `<span class="tag tag-custom">#${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function stripText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstNumber(value) {
  const match = String(value || "").replace(/\./g, "").match(/\d[\d,]*/);
  return match ? Number(match[0].replace(/\D/g, "")) : 0;
}

function normalizeWikiImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("https://")) return url;
  return "";
}

function getDinoProgress(dino) {
  const target = Math.max(1, toNumber(dino.targetLevel, 40));
  const current = Math.max(0, toNumber(dino.currentLevel, 1));
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function getGoalProgress(goal) {
  const target = Math.max(1, toNumber(goal.target, 1));
  const current = Math.max(0, toNumber(goal.current, 0));
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function isGoalDone(goal) {
  return toNumber(goal.current, 0) >= Math.max(1, toNumber(goal.target, 1));
}

function isGoalOverdue(goal) {
  return !isGoalDone(goal) && goal.dueDate && goal.dueDate < todayIso();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max, fallback) {
  return Math.max(min, Math.min(max, toNumber(value, fallback)));
}

function sortTasks(a, b) {
  const statusRank = { doing: 0, pending: 1, done: 2 };
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return (
    Number(isOverdue(b)) - Number(isOverdue(a)) ||
    (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) ||
    (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
    (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

function sortGoals(a, b) {
  return (
    Number(isGoalDone(a)) - Number(isGoalDone(b)) ||
    Number(isGoalOverdue(b)) - Number(isGoalOverdue(a)) ||
    (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

function sortMissions(a, b) {
  const statusRank = { doing: 0, planned: 1, done: 2 };
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return (
    (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) ||
    (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
    (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") ||
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

function isCloudinaryReady(settings = state.settings) {
  return Boolean(settings.cloudName && settings.uploadPreset);
}

function isDueToday(task) {
  return task.status !== "done" && task.dueDate === todayIso();
}

function isOverdue(task) {
  return task.status !== "done" && task.dueDate && task.dueDate < todayIso();
}

function isMissionOverdue(mission) {
  return mission.status !== "done" && mission.dueDate && mission.dueDate < todayIso();
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

function formatDay(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

function formatMonth(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(toNumber(value, 0));
}

function addDaysIso(days) {
  const date = new Date(`${todayIso()}T00:00:00`);
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
  if (value.startsWith("https://cdn.paleo.gg/")) return value;
  if (value.startsWith("https://static.wikia.nocookie.net/")) return value;
  if (value.startsWith("https://static.wikia.com/")) return value;
  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("blob:")) return value;
  return "";
}

function guessImageSource(url) {
  const value = String(url || "");
  if (value.startsWith("https://res.cloudinary.com/")) return "cloudinary";
  if (value.startsWith("data:image/")) return "local";
  return "none";
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
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
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
