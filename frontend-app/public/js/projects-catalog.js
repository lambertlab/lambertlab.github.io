(function () {
  "use strict";
  if (window.__LL_PROJECTS_CATALOG_BOOTSTRAPPED__) {
    return;
  }

  var catalogRoot = document.querySelector("[data-project-catalog]");
  if (!catalogRoot) {
    return;
  }

  var searchInput = document.getElementById("project-search");
  var sortSelect = document.getElementById("sort-by");
  var stageSelect = document.getElementById("stage-filter");
  var sourceSelect = document.getElementById("source-filter");
  var typeSelect = document.getElementById("type-filter");
  var featuredOnlyInput = document.getElementById("featured-only");
  var clearButton = document.getElementById("clear-filters");
  var retryButton = document.getElementById("retry-fetch");
  var grid = catalogRoot.querySelector("[data-project-grid]");
  var projectsRuntime = window.__LL_PROJECTS_RUNTIME__ || null;
  var resultsMeta = catalogRoot.querySelector("[data-results-meta]");
  var fetchStatus = catalogRoot.querySelector("[data-fetch-status]");
  var tagCloud = catalogRoot.querySelector("[data-tag-cloud]");
  var emptyState = catalogRoot.querySelector("[data-empty-state]");
  var loadingState = catalogRoot.querySelector("[data-loading-state]");
  var errorState = catalogRoot.querySelector("[data-error-state]");
  var errorDetail = catalogRoot.querySelector("[data-error-detail]");
  var totalItemsValue = catalogRoot.querySelector("[data-total-items]");
  var liveItemsValue = catalogRoot.querySelector("[data-live-items]");
  var lastSyncValue = catalogRoot.querySelector("[data-last-sync]");
  var sourceCountValue = catalogRoot.querySelector("[data-source-count]");
  var viewButtons = Array.prototype.slice.call(catalogRoot.querySelectorAll("[data-view-mode]"));

  if (!searchInput || !sortSelect || !stageSelect || !sourceSelect || !typeSelect || !featuredOnlyInput || !clearButton || !retryButton || !grid) {
    return;
  }
  window.__LL_PROJECTS_CATALOG_BOOTSTRAPPED__ = true;

  var validSort = {
    recent: true,
    stars: true,
    name: true
  };

  var validStage = {
    all: true,
    building: true,
    active: true,
    maintenance: true,
    research: true,
    archived: true
  };

  var validSource = {
    all: true,
    github: true,
    local: true,
    "private": true,
    hybrid: true
  };

  var validType = {
    all: true,
    website: true,
    backend: true,
    tooling: true,
    infra: true,
    research: true,
    agent: true,
    data: true,
    library: true
  };
  var currentUiLocale = readUiLocale();

  function normalizeUiLocale(value) {
    return value === "en" || value === "zh-CN" ? value : "zh-CN";
  }

  function readUiLocale() {
    var htmlLocale = document.documentElement.getAttribute("data-ui-locale") || document.documentElement.getAttribute("lang");
    if (htmlLocale === "en" || htmlLocale === "zh-CN") {
      return htmlLocale;
    }
    if (window.__LL_UI_LOCALE__ === "en" || window.__LL_UI_LOCALE__ === "zh-CN") {
      return window.__LL_UI_LOCALE__;
    }
    return "zh-CN";
  }

  function isEnglishUi() {
    return currentUiLocale === "en";
  }

  function getUiText(zhText, enText) {
    return isEnglishUi() ? enText : zhText;
  }

  function normalizeLabelValue(value) {
    return toText(value).toLowerCase().replace(/[_\s]+/g, "-");
  }

  function translateStageLabel(stage) {
    var normalized = normalizeLabelValue(stage);
    if (!normalized) {
      return getUiText("待补充", "Pending");
    }
    if (isEnglishUi()) {
      if (normalized === "building") return "Building";
      if (normalized === "active") return "Active";
      if (normalized === "maintenance") return "Maintenance";
      if (normalized === "research") return "Research";
      if (normalized === "archived") return "Archived";
      return stage;
    }
    if (normalized === "building") return "建设中";
    if (normalized === "active") return "活跃";
    if (normalized === "maintenance") return "维护中";
    if (normalized === "research") return "研究中";
    if (normalized === "archived") return "已归档";
    return stage;
  }

  function translateSourceTypeLabel(sourceType) {
    var normalized = normalizeLabelValue(sourceType);
    if (!normalized) {
      return getUiText("待补充", "Pending");
    }
    if (isEnglishUi()) {
      if (normalized === "github") return "GitHub";
      if (normalized === "local") return "Local";
      if (normalized === "private") return "Private";
      if (normalized === "hybrid") return "Hybrid";
      return sourceType;
    }
    if (normalized === "github") return "GitHub";
    if (normalized === "local") return "本地";
    if (normalized === "private") return "私有";
    if (normalized === "hybrid") return "混合";
    return sourceType;
  }

  function translateProjectTypeLabel(projectType) {
    var normalized = normalizeLabelValue(projectType);
    if (!normalized) {
      return getUiText("待补充", "Pending");
    }
    if (isEnglishUi()) {
      if (normalized === "website") return "Website";
      if (normalized === "backend") return "Backend";
      if (normalized === "tooling") return "Tooling";
      if (normalized === "infra") return "Infrastructure";
      if (normalized === "research") return "Research";
      if (normalized === "agent") return "Agent";
      if (normalized === "data") return "Data";
      if (normalized === "library") return "Library";
      return projectType;
    }
    if (normalized === "website") return "站点";
    if (normalized === "backend") return "后端";
    if (normalized === "tooling") return "工具";
    if (normalized === "infra") return "基础设施";
    if (normalized === "research") return "研究";
    if (normalized === "agent") return "智能体";
    if (normalized === "data") return "数据";
    if (normalized === "library") return "库";
    return projectType;
  }

  function resolveCanonicalCatalogPath(pathname) {
    var value = toText(pathname);
    if (!value || value === "/projects" || value === "/projects/" || value === "/projects/index.html") {
      return "/projects/";
    }
    return "/projects/";
  }

  function toText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function toBoolean(value) {
    if (value === true) {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }
    var normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
  }

  function toInteger(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.round(value);
    }
    if (typeof value !== "string") {
      return 0;
    }
    var parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function getPositiveInteger(value, fallback) {
    var parsed = toInteger(value);
    return parsed > 0 ? parsed : fallback;
  }

  function parseTimeScore(rawValue) {
    var value = toText(rawValue);
    if (!value) {
      return 0;
    }
    var parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatDateTime(rawValue) {
    var value = toText(rawValue);
    if (!value) {
      return "--";
    }
    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }
    return parsed.toLocaleString(isEnglishUi() ? "en-US" : "zh-CN", {
      year: "numeric",
      month: isEnglishUi() ? "short" : "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function formatDate(rawValue) {
    var value = toText(rawValue);
    if (!value) {
      return "--";
    }
    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }
    return parsed.toLocaleDateString(isEnglishUi() ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function formatNumber(value) {
    var normalized = typeof value === "number" ? value : toInteger(value);
    return normalized.toLocaleString(isEnglishUi() ? "en-US" : "zh-CN");
  }

  function normalizeTags(rawTags) {
    if (!Array.isArray(rawTags)) {
      return [];
    }
    var seen = {};
    var tags = [];
    rawTags.forEach(function (item) {
      var tag = toText(item).toLowerCase();
      if (!tag || seen[tag]) {
        return;
      }
      seen[tag] = true;
      tags.push(tag);
    });
    return tags;
  }

  function normalizeLinks(rawLinks) {
    var links = rawLinks && typeof rawLinks === "object" ? rawLinks : {};
    return {
      primary: toText(links.primary),
      repo: toText(links.repo),
      demo: toText(links.demo),
      docs: toText(links.docs),
      notes: toText(links.notes)
    };
  }

  function mapProject(rawProject, index) {
    if (projectsRuntime && typeof projectsRuntime.normalizeProject === "function") {
      return projectsRuntime.normalizeProject(rawProject, index);
    }

    var project = rawProject && typeof rawProject === "object" ? rawProject : {};
    var fullName = toText(project.full_name);
    var fallbackName = fullName ? fullName.split("/").pop() : "";
    var name = toText(project.name) || fallbackName || ("project-" + (index + 1));
    var sourceUrl = toText(project.url);

    if (!sourceUrl && fullName) {
      sourceUrl = "https://github.com/" + fullName;
    }

    var tags = normalizeTags(project.tags);
    var stack = normalizeTags(project.stack);
    var pushedAt = toText(project.pushed_at);
    var updatedAt = toText(project.updated_at);
    var recencyScore = parseTimeScore(pushedAt) || parseTimeScore(updatedAt);
    var isActive = project.is_active === true;
    var archived = project.archived === true;
    var status = archived ? "archived" : (isActive ? "active" : "inactive");

    var summary = toText(project.summary) || toText(project.description);
    var stage = toText(project.stage) || status;
    var sourceType = toText(project.source_type) || toText(project.source);
    var projectType = toText(project.project_type);
    var links = normalizeLinks(project.links);

    var searchText = [
      name,
      fullName,
      toText(project.description),
      summary,
      toText(project.language),
      stage,
      sourceType,
      projectType,
      tags.join(" "),
      stack.join(" ")
    ].join(" ").toLowerCase();

    return {
      index: index,
      id: project.id,
      name: name,
      fullName: fullName,
      url: sourceUrl,
      description: toText(project.description),
      summary: summary,
      stage: stage,
      sourceType: sourceType,
      projectType: projectType,
      stack: stack,
      links: links,
      language: toText(project.language),
      stars: toInteger(project.stargazers_count),
      forks: toInteger(project.forks_count),
      visibility: toText(project.visibility),
      source: toText(project.source),
      tags: tags,
      status: status,
      isFeatured: project.is_featured === true,
      detailPath: "",
      canonicalPath: "",
      slug: toText(project.slug),
      featuredRank: null,
      isActive: isActive,
      archived: archived,
      pushedAt: pushedAt,
      updatedAt: updatedAt,
      syncedAt: toText(project.synced_at),
      recencyScore: recencyScore,
      searchText: searchText
    };
  }

  var defaultState = {
    q: "",
    sort: "recent",
    stage: "all",
    source: "all",
    type: "all",
    featured: false,
    view: "grid"
  };

  var allProjects = [];
  var fetchedAtValue = "";
  var fetchedCount = 0;
  var latestRequestId = 0;
  var lastFetchKey = "";

  function getActiveView() {
    var active = viewButtons.find(function (button) {
      return button.classList.contains("active");
    });

    if (!active) {
      return "grid";
    }

    var view = (active.getAttribute("data-view-mode") || "").trim().toLowerCase();
    return view === "list" ? "list" : "grid";
  }

  function setView(view) {
    var normalized = view === "list" ? "list" : "grid";

    viewButtons.forEach(function (button) {
      var isActive = (button.getAttribute("data-view-mode") || "") === normalized;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    grid.setAttribute("data-view", normalized);
  }

  function readStateFromUrl() {
    var params = new URLSearchParams(window.location.search);

    var q = (params.get("q") || "").trim();
    var sort = (params.get("sort") || defaultState.sort).trim().toLowerCase();
    var featured = toBoolean(params.get("featured"));
    var view = (params.get("view") || defaultState.view).trim().toLowerCase();

    // Read new three-dimensional filters
    var stage = (params.get("stage") || "").trim().toLowerCase();
    var source = (params.get("source") || "").trim().toLowerCase();
    var type = (params.get("type") || "").trim().toLowerCase();

    // Backward compatibility: map old ?status= to stage
    if (!stage && params.has("status")) {
      var oldStatus = (params.get("status") || "").trim().toLowerCase();
      if (oldStatus === "active" || oldStatus === "archived") {
        stage = oldStatus;
      } else if (oldStatus === "inactive") {
        stage = "maintenance";
      }
    }

    if (!Object.prototype.hasOwnProperty.call(validSort, sort)) {
      sort = defaultState.sort;
    }
    if (!stage || !Object.prototype.hasOwnProperty.call(validStage, stage)) {
      stage = defaultState.stage;
    }
    if (!source || !Object.prototype.hasOwnProperty.call(validSource, source)) {
      source = defaultState.source;
    }
    if (!type || !Object.prototype.hasOwnProperty.call(validType, type)) {
      type = defaultState.type;
    }
    if (view !== "list") {
      view = "grid";
    }

    return {
      q: q,
      sort: sort,
      stage: stage,
      source: source,
      type: type,
      featured: featured,
      view: view
    };
  }

  function writeStateToControls(state) {
    searchInput.value = state.q;
    sortSelect.value = state.sort;
    stageSelect.value = state.stage;
    sourceSelect.value = state.source;
    typeSelect.value = state.type;
    featuredOnlyInput.checked = state.featured === true;
    setView(state.view);
  }

  function readStateFromControls() {
    var q = (searchInput.value || "").trim();
    var sort = (sortSelect.value || "").trim().toLowerCase();
    var stage = (stageSelect.value || "").trim().toLowerCase();
    var source = (sourceSelect.value || "").trim().toLowerCase();
    var type = (typeSelect.value || "").trim().toLowerCase();
    var featured = featuredOnlyInput.checked === true;
    var view = getActiveView();

    if (!Object.prototype.hasOwnProperty.call(validSort, sort)) {
      sort = defaultState.sort;
    }
    if (!Object.prototype.hasOwnProperty.call(validStage, stage)) {
      stage = defaultState.stage;
    }
    if (!Object.prototype.hasOwnProperty.call(validSource, source)) {
      source = defaultState.source;
    }
    if (!Object.prototype.hasOwnProperty.call(validType, type)) {
      type = defaultState.type;
    }

    return {
      q: q,
      sort: sort,
      stage: stage,
      source: source,
      type: type,
      featured: featured,
      view: view
    };
  }

  function writeStateToUrl(state) {
    var params = new URLSearchParams();

    if (state.q) {
      params.set("q", state.q);
    }

    if (state.sort !== defaultState.sort) {
      params.set("sort", state.sort);
    }

    if (state.stage !== defaultState.stage) {
      params.set("stage", state.stage);
    }

    if (state.source !== defaultState.source) {
      params.set("source", state.source);
    }

    if (state.type !== defaultState.type) {
      params.set("type", state.type);
    }

    if (state.featured) {
      params.set("featured", "1");
    }

    if (state.view !== defaultState.view) {
      params.set("view", state.view);
    }

    var canonicalPath = resolveCanonicalCatalogPath(window.location.pathname);
    var next = params.toString();
    var hash = window.location.hash || "";
    var targetUrl = next ? (canonicalPath + "?" + next) : canonicalPath;
    if (hash) {
      targetUrl += hash;
    }
    window.history.replaceState({}, "", targetUrl);
  }

  function matchSearch(record, query) {
    if (!query) {
      return true;
    }

    var tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return true;
    }

    return tokens.every(function (token) {
      return record.searchText.indexOf(token) !== -1;
    });
  }

  function filterRecords(records, state) {
    return records.filter(function (record) {
      if (state.stage !== "all" && record.stage !== state.stage) return false;
      if (state.source !== "all" && record.sourceType !== state.source) return false;
      if (state.type !== "all" && record.projectType !== state.type) return false;
      return matchSearch(record, state.q);
    });
  }

  function sortRecords(records, sortMode) {
    var sorted = records.slice();

    sorted.sort(function (a, b) {
      if (sortMode === "stars") {
        if (b.stars !== a.stars) {
          return b.stars - a.stars;
        }
      } else if (sortMode === "name") {
        var byName = a.name.localeCompare(b.name, "en", { sensitivity: "base" });
        if (byName !== 0) {
          return byName;
        }
      } else {
        if (b.recencyScore !== a.recencyScore) {
          return b.recencyScore - a.recencyScore;
        }
      }

      return a.index - b.index;
    });

    return sorted;
  }

  function createStageBadge(stage) {
    var badge = document.createElement("span");
    badge.className = "status-pill";

    if (stage === "active") {
      badge.classList.add("stage-active");
      badge.textContent = translateStageLabel(stage);
      return badge;
    }
    if (stage === "building") {
      badge.classList.add("stage-building");
      badge.textContent = translateStageLabel(stage);
      return badge;
    }
    if (stage === "research") {
      badge.classList.add("stage-research");
      badge.textContent = translateStageLabel(stage);
      return badge;
    }
    if (stage === "archived") {
      badge.classList.add("stage-archived");
      badge.textContent = translateStageLabel(stage);
      return badge;
    }
    if (stage === "maintenance") {
      badge.classList.add("stage-maintenance");
      badge.textContent = translateStageLabel(stage);
      return badge;
    }

    // fallback for unknown/inactive
    badge.classList.add("stage-maintenance");
    badge.textContent = stage ? translateStageLabel(stage) : getUiText("未知", "Unknown");
    return badge;
  }

  function createTextNodeWithClass(tagName, className, text) {
    var node = document.createElement(tagName);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function createStatBox(label, value) {
    var box = document.createElement("div");
    box.className = "stat-box";
    box.appendChild(createTextNodeWithClass("p", "stat-label", label));
    box.appendChild(createTextNodeWithClass("p", "stat-value", value));
    return box;
  }

  function setText(selector, text) {
    var node = catalogRoot.querySelector(selector);
    if (node) {
      node.textContent = text;
    }
  }

  function setOptionLabel(selectElement, value, text) {
    if (!selectElement) {
      return;
    }
    var option = selectElement.querySelector('option[value="' + value + '"]');
    if (option) {
      option.textContent = text;
    }
  }

  function applyStaticCatalogCopy() {
    var hero = catalogRoot.querySelector(".page-hero");
    var heroMetrics = catalogRoot.querySelector(".hero-metrics");
    var controlStrip = catalogRoot.querySelector(".control-strip");
    var catalogLayout = catalogRoot.querySelector(".catalog-layout");
    var filterPanel = catalogRoot.querySelector(".filter-panel");
    var resultsHead = catalogRoot.querySelector(".results-head");
    var viewToggle = catalogRoot.querySelector(".view-toggle");
    var errorTitle = catalogRoot.querySelector(".catalog-state-title");
    var listFooter = catalogRoot.querySelector(".list-footer");

    if (hero) {
      hero.setAttribute("aria-label", getUiText("项目目录简介", "Projects intro"));
    }
    if (heroMetrics) {
      heroMetrics.setAttribute("aria-label", getUiText("目录指标", "Catalog metrics"));
    }
    if (controlStrip) {
      controlStrip.setAttribute("aria-label", getUiText("项目控制项", "Project controls"));
    }
    if (catalogLayout) {
      catalogLayout.setAttribute("aria-label", getUiText("项目目录", "Project catalog"));
    }
    if (filterPanel) {
      filterPanel.setAttribute("aria-label", getUiText("目录筛选", "Catalog filters"));
    }
    if (viewToggle) {
      viewToggle.setAttribute("aria-label", getUiText("视图模式", "View mode"));
    }

    setText(".hero-kicker", getUiText("项目目录", "Project Catalog"));
    setText(".hero-title", getUiText("浏览项目目录", "Explore the Project Catalog"));
    setText(".hero-desc", getUiText("浏览所有项目，按阶段、来源与类型快速筛选和发现。支持搜索、排序与 URL 分享。", "Browse every project and filter by stage, source, and type. Search, sort, and replay the current state from the URL."));
    setText(".hero-chip-row .chip:nth-child(1)", getUiText("阶段筛选", "Stage Filter"));
    setText(".hero-chip-row .chip:nth-child(2)", getUiText("来源类型", "Source Type"));
    setText(".hero-chip-row .chip:nth-child(3)", getUiText("项目类型", "Project Type"));
    setText(".hero-chip-row .chip:nth-child(4)", getUiText("URL 回放", "URL Replay"));
    setText(".hero-metrics .metric:nth-child(1) .label", getUiText("项目数", "Projects"));
    setText(".hero-metrics .metric:nth-child(1) .desc", getUiText("目录项目总数", "Total projects in the catalog"));
    setText(".hero-metrics .metric:nth-child(2) .label", getUiText("活跃中", "Active"));
    setText(".hero-metrics .metric:nth-child(2) .desc", getUiText("当前活跃项目数量", "Projects currently marked as active"));
    setText(".hero-metrics .metric:nth-child(3) .label", getUiText("最近更新", "Last Updated"));
    setText(".hero-metrics .metric:nth-child(3) .desc", getUiText("目录最近更新时间", "Latest catalog refresh time"));
    setText(".hero-metrics .metric:nth-child(4) .label", getUiText("来源数", "Sources"));
    setText(".hero-metrics .metric:nth-child(4) .desc", getUiText("项目来源类型数量", "Distinct project source types"));
    setText('label[for="project-search"]', getUiText("搜索", "Search"));
    setText('label[for="sort-by"]', getUiText("排序", "Sort"));
    setText('label[for="stage-filter"]', getUiText("阶段", "Stage"));
    setText('label[for="source-filter"]', getUiText("来源", "Source"));
    setText('label[for="type-filter"]', getUiText("类型", "Type"));
    setText("#clear-filters", getUiText("重置", "Clear"));
    setText(".filter-group:nth-child(1) .filter-title", getUiText("精选", "Highlight"));
    var featuredOnlyLabel = catalogRoot.querySelector(".filter-group:nth-child(1) .check-item");
    if (featuredOnlyLabel) {
      var featuredOnlyCheckbox = featuredOnlyLabel.querySelector("input");
      featuredOnlyLabel.textContent = "";
      if (featuredOnlyCheckbox) {
        featuredOnlyLabel.appendChild(featuredOnlyCheckbox);
      }
      featuredOnlyLabel.appendChild(document.createTextNode(" " + getUiText("仅看精选", "Featured only")));
    }
    setText(".filter-group:nth-child(2) .filter-title", getUiText("标签", "Tags"));
    setText(".filter-group:nth-child(3) .filter-title", getUiText("状态", "Status"));
    setText(".results-title", getUiText("项目目录", "Project Directory"));
    setText(".view-btn[data-view-mode=\"grid\"]", getUiText("网格", "Grid"));
    setText(".view-btn[data-view-mode=\"list\"]", getUiText("列表", "List"));
    setText("#retry-fetch", getUiText("重试", "Retry"));

    if (searchInput) {
      searchInput.placeholder = getUiText("按名称、摘要、标签、技术栈搜索", "Search by name, summary, tags, or stack");
    }

    setOptionLabel(sortSelect, "recent", getUiText("最近更新", "Most Recent"));
    setOptionLabel(sortSelect, "stars", "Stars");
    setOptionLabel(sortSelect, "name", getUiText("名称 (A-Z)", "Name (A-Z)"));
    setOptionLabel(stageSelect, "all", getUiText("全部", "All"));
    setOptionLabel(stageSelect, "building", getUiText("建设中", "Building"));
    setOptionLabel(stageSelect, "active", getUiText("活跃", "Active"));
    setOptionLabel(stageSelect, "maintenance", getUiText("维护中", "Maintenance"));
    setOptionLabel(stageSelect, "research", getUiText("研究中", "Research"));
    setOptionLabel(stageSelect, "archived", getUiText("已归档", "Archived"));
    setOptionLabel(sourceSelect, "all", getUiText("全部", "All"));
    setOptionLabel(sourceSelect, "github", "GitHub");
    setOptionLabel(sourceSelect, "local", getUiText("本地", "Local"));
    setOptionLabel(sourceSelect, "private", getUiText("私有", "Private"));
    setOptionLabel(sourceSelect, "hybrid", getUiText("混合", "Hybrid"));
    setOptionLabel(typeSelect, "all", getUiText("全部", "All"));
    setOptionLabel(typeSelect, "website", getUiText("站点", "Website"));
    setOptionLabel(typeSelect, "backend", getUiText("后端", "Backend"));
    setOptionLabel(typeSelect, "tooling", getUiText("工具", "Tooling"));
    setOptionLabel(typeSelect, "infra", getUiText("基础设施", "Infrastructure"));
    setOptionLabel(typeSelect, "research", getUiText("研究", "Research"));
    setOptionLabel(typeSelect, "agent", getUiText("智能体", "Agent"));
    setOptionLabel(typeSelect, "data", getUiText("数据", "Data"));
    setOptionLabel(typeSelect, "library", getUiText("库", "Library"));

    if (errorTitle && errorState && !errorState.hidden) {
      errorTitle.textContent = getUiText("目录加载失败", "Catalog load failed");
    }
    if (tagCloud && !allProjects.length && tagCloud.children.length === 1) {
      var onlyTag = tagCloud.children[0];
      if (onlyTag && onlyTag.textContent === "Waiting") {
        onlyTag.textContent = getUiText("等待中", "Waiting");
      }
    }
    if (loadingState && !loadingState.hidden) {
      loadingState.textContent = getUiText("正在加载项目目录...", "Loading the project directory...");
    }
    if (listFooter) {
      var footerItems = listFooter.querySelectorAll("span");
      if (footerItems[0]) {
        footerItems[0].textContent = getUiText("项目目录", "Project directory");
      }
      if (footerItems[1]) {
        footerItems[1].textContent = getUiText("筛选状态自动同步到 URL，可刷新与分享回放。", "Filters stay synced to the URL so the current view can be refreshed or shared.");
      }
    }
  }

  function createProjectCard(record) {
    var article = document.createElement("article");
    article.className = "project-card";
    article.setAttribute("data-stage", record.stage);

    var top = document.createElement("div");
    top.className = "project-top";

    var title = document.createElement("h3");
    title.className = "project-name";
    var titleLink = document.createElement("a");
    titleLink.textContent = record.name;

    var primaryUrl = record.detailPath || record.canonicalPath;
    titleLink.href = primaryUrl || "#";
    if (!primaryUrl) {
      titleLink.setAttribute("aria-disabled", "true");
    }
    title.appendChild(titleLink);
    top.appendChild(title);
    top.appendChild(createStageBadge(record.stage));
    article.appendChild(top);

    var description = record.summary || getUiText("暂未提供摘要。", "No description provided.");
    article.appendChild(createTextNodeWithClass("p", "project-desc", description));

    var tagsWrap = document.createElement("div");
    tagsWrap.className = "project-tags";
    if (record.tags.length) {
      record.tags.slice(0, 4).forEach(function (tag) {
        tagsWrap.appendChild(createTextNodeWithClass("span", "project-tag", tag));
      });
    } else {
      tagsWrap.appendChild(createTextNodeWithClass("span", "project-tag", getUiText("未标记", "untagged")));
    }
    if (record.stack.length) {
      record.stack.slice(0, 3).forEach(function (s) {
        tagsWrap.appendChild(createTextNodeWithClass("span", "project-tag stack-tag", s));
      });
    }
    article.appendChild(tagsWrap);

    var stats = document.createElement("div");
    stats.className = "project-stats";
    stats.appendChild(createStatBox(getUiText("来源", "Source"), record.sourceType ? translateSourceTypeLabel(record.sourceType) : "--"));
    stats.appendChild(createStatBox(getUiText("类型", "Type"), record.projectType ? translateProjectTypeLabel(record.projectType) : "--"));
    stats.appendChild(createStatBox(getUiText("更新于", "Updated"), formatDate(record.updatedAt || record.pushedAt)));
    article.appendChild(stats);

    var actions = document.createElement("div");
    actions.className = "project-actions";

    var mainUrl = record.detailPath || record.canonicalPath;
    if (mainUrl) {
      var mainButton = document.createElement("a");
      mainButton.className = "btn primary";
      mainButton.href = mainUrl;
      mainButton.textContent = getUiText("项目详情", "Project Detail");
      actions.appendChild(mainButton);
    } else {
      var disabledButton = document.createElement("a");
      disabledButton.className = "btn primary";
      disabledButton.href = "#";
      disabledButton.setAttribute("aria-disabled", "true");
      disabledButton.textContent = getUiText("详情待补充", "Detail Pending");
      actions.appendChild(disabledButton);
    }

    if (record.links.primary && record.links.primary !== mainUrl) {
      var primaryLinkButton = document.createElement("a");
      primaryLinkButton.className = "btn";
      primaryLinkButton.href = record.links.primary;
      if (/^https?:\/\//i.test(record.links.primary)) {
        primaryLinkButton.target = "_blank";
        primaryLinkButton.rel = "noreferrer";
      }
      primaryLinkButton.textContent = getUiText("主入口", "Primary Link");
      actions.appendChild(primaryLinkButton);
    }

    if (record.links.repo) {
      var repoButton = document.createElement("a");
      repoButton.className = "btn";
      repoButton.href = record.links.repo;
      repoButton.target = "_blank";
      repoButton.rel = "noreferrer";
      repoButton.textContent = getUiText("仓库", "Repository");
      actions.appendChild(repoButton);
    }

    if (record.links.demo) {
      var demoButton = document.createElement("a");
      demoButton.className = "btn";
      demoButton.href = record.links.demo;
      demoButton.target = "_blank";
      demoButton.rel = "noreferrer";
      demoButton.textContent = "Demo";
      actions.appendChild(demoButton);
    }

    if (record.links.docs) {
      var docsButton = document.createElement("a");
      docsButton.className = "btn";
      docsButton.href = record.links.docs;
      docsButton.target = "_blank";
      docsButton.rel = "noreferrer";
      docsButton.textContent = "Docs";
      actions.appendChild(docsButton);
    }

    article.appendChild(actions);
    return article;
  }

  function setFetchStatus(text) {
    if (fetchStatus) {
      fetchStatus.textContent = text;
    }
  }

  function showLoading(message) {
    if (loadingState) {
      loadingState.hidden = false;
      loadingState.textContent = message || getUiText("正在加载项目目录...", "Loading the project directory...");
    }
    if (errorState) {
      errorState.hidden = true;
    }
    if (emptyState) {
      emptyState.hidden = true;
    }
    grid.hidden = true;
  }

  function showError(message) {
    if (loadingState) {
      loadingState.hidden = true;
    }
    if (errorState) {
      errorState.hidden = false;
    }
    if (errorDetail) {
      errorDetail.textContent = message;
    }
    if (emptyState) {
      emptyState.hidden = true;
    }
    grid.hidden = true;
    setFetchStatus(getUiText("目录读取失败，可点击重试。", "Catalog loading failed. Click Retry to try again."));
    if (resultsMeta) {
      resultsMeta.textContent = getUiText("项目目录加载失败", "Failed to load projects");
    }
    var errorTitle = catalogRoot.querySelector(".catalog-state-title");
    if (errorTitle) {
      errorTitle.textContent = getUiText("目录加载失败", "Catalog load failed");
    }
  }

  function showEmpty(message) {
    if (loadingState) {
      loadingState.hidden = true;
    }
    if (errorState) {
      errorState.hidden = true;
    }
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = message;
    }
    grid.hidden = true;
  }

  function showGrid() {
    if (loadingState) {
      loadingState.hidden = true;
    }
    if (errorState) {
      errorState.hidden = true;
    }
    if (emptyState) {
      emptyState.hidden = true;
    }
    grid.hidden = false;
  }

  function renderTagCloud(records) {
    if (!tagCloud) {
      return;
    }
    tagCloud.innerHTML = "";

    var counters = {};
    records.forEach(function (record) {
      record.tags.forEach(function (tag) {
        counters[tag] = (counters[tag] || 0) + 1;
      });
    });

    var orderedTags = Object.keys(counters).sort(function (a, b) {
      if (counters[b] !== counters[a]) {
        return counters[b] - counters[a];
      }
      return a.localeCompare(b);
    }).slice(0, 12);

    if (!orderedTags.length) {
      tagCloud.appendChild(createTextNodeWithClass("span", "tag", getUiText("暂无标签", "No tags")));
      return;
    }

    orderedTags.forEach(function (tag) {
      var chip = createTextNodeWithClass("span", "tag", tag);
      tagCloud.appendChild(chip);
    });
  }

  function countSourceTypes(projects) {
    var seen = {};
    projects.forEach(function (p) {
      var st = p.sourceType;
      if (st) {
        seen[st] = true;
      }
    });
    return Object.keys(seen).length;
  }

  function updateSummary(state, visibleCount) {
    var totalCount = allProjects.length;
    var activeCount = allProjects.filter(function (project) {
      return project.stage === "active" || project.status === "active";
    }).length;

    if (resultsMeta) {
      var hasFilter = state.q || state.stage !== "all" || state.source !== "all" || state.type !== "all" || state.featured;
      var filterLabel = hasFilter ? getUiText("筛选已生效", "Filters active") : getUiText("全部筛选", "All filters");
      var fetchedLabel = fetchedAtValue
        ? (getUiText("抓取于 ", "Fetched ") + formatDateTime(fetchedAtValue))
        : getUiText("抓取于 --", "Fetched --");
      resultsMeta.textContent = getUiText("当前展示 ", "Showing ") + visibleCount + getUiText(" / ", " of ") + totalCount + getUiText(" 条 · ", " entries · ") + filterLabel + " · " + fetchedLabel;
    }

    if (totalItemsValue) {
      totalItemsValue.textContent = totalCount + " " + getUiText("个项目", "Projects");
    }

    if (liveItemsValue) {
      liveItemsValue.textContent = activeCount + " " + getUiText("个活跃", "Active");
    }

    if (lastSyncValue) {
      lastSyncValue.textContent = fetchedAtValue ? formatDateTime(fetchedAtValue) : "--";
    }

    if (sourceCountValue) {
      var sourceTypeCount = countSourceTypes(allProjects);
      sourceCountValue.textContent = sourceTypeCount > 0 ? sourceTypeCount + " " + getUiText("种", "Types") : "--";
    }
  }

  function renderRecords(state) {
    var filtered = filterRecords(allProjects, state);
    var sorted = sortRecords(filtered, state.sort);

    grid.innerHTML = "";
    sorted.forEach(function (record) {
      grid.appendChild(createProjectCard(record));
    });

    updateSummary(state, sorted.length);

    if (allProjects.length === 0) {
      showEmpty(getUiText("后端返回空目录（count=0）。请先同步项目数据后重试。", "The backend returned an empty catalog (count=0). Sync project data first and retry."));
      setFetchStatus(getUiText("目录加载成功，但当前无项目数据。", "Catalog loaded successfully, but no project data is available."));
      return;
    }

    if (sorted.length === 0) {
      showEmpty(getUiText("当前筛选条件无匹配项。可以放宽关键词或重置筛选。", "No projects match the current filters. Try loosening the query or clearing filters."));
      setFetchStatus(getUiText("目录加载成功，筛选后无匹配项。", "Catalog loaded successfully, but no entries match the current filters."));
      return;
    }

    showGrid();
    setFetchStatus(getUiText("目录加载成功，共 ", "Catalog loaded successfully with ") + fetchedCount + getUiText(" 条；当前展示 ", " entries; showing ") + sorted.length + (isEnglishUi() ? "." : " 条。"));
  }

  function buildProjectsEndpoint() {
    var runtimeConfig = window.__APP_CONFIG__ || {};
    var configuredBase = typeof runtimeConfig.API_BASE === "string" ? runtimeConfig.API_BASE.trim() : "";
    var origin = (window.location && window.location.origin) || "";

    if (!configuredBase) {
      return origin + "/projects";
    }
    if (/^https?:\/\//i.test(configuredBase)) {
      return configuredBase.replace(/\/+$/, "") + "/projects";
    }
    if (configuredBase.charAt(0) === "/") {
      return origin + configuredBase.replace(/\/+$/, "") + "/projects";
    }
    return origin + "/projects";
  }

  function buildRequestUrl(state) {
    var endpoint = buildProjectsEndpoint();
    var params = new URLSearchParams();
    params.set("limit", "200");
    params.set("include_inactive", "true");
    params.set("include_archived", "true");

    if (state.featured) {
      params.set("featured_only", "true");
    }

    return endpoint + "?" + params.toString();
  }

  function parseResponsePayload(payload) {
    if (!payload || payload.ok !== true || !Array.isArray(payload.projects)) {
      throw new Error(getUiText("项目目录响应不符合协议（ok/projects）。", "The project catalog response does not satisfy the contract (ok/projects)."));
    }

    fetchedCount = toInteger(payload.count);
    if (fetchedCount <= 0) {
      fetchedCount = payload.projects.length;
    }
    fetchedAtValue = toText(payload.fetched_at);
    allProjects = payload.projects.map(mapProject);
  }

  function getFetchKey(state) {
    return state.featured ? "1" : "0";
  }

  function fetchProjects(state) {
    var requestId = ++latestRequestId;
    var runtimeConfig = window.__APP_CONFIG__ || {};
    var timeoutMs = getPositiveInteger(runtimeConfig.REQUEST_TIMEOUT_MS, 3000);
    var url = buildRequestUrl(state);
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId = null;

    showLoading(getUiText("正在加载项目目录...", "Loading the project directory..."));
    setFetchStatus(getUiText("正在读取目录数据...", "Fetching the latest catalog data..."));

    if (controller) {
      timeoutId = window.setTimeout(function () {
        controller.abort();
      }, timeoutMs);
    }

    fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) {
        return response.json().catch(function () {
          return {};
        }).then(function (body) {
          var detail = toText(body.detail);
          var message = detail || ("Request failed with status " + response.status + ".");
          throw new Error(message);
        });
      }
      return response.json();
    }).then(function (payload) {
      if (requestId !== latestRequestId) {
        return;
      }

      parseResponsePayload(payload);
      renderTagCloud(allProjects);
      lastFetchKey = getFetchKey(state);
      renderRecords(readStateFromControls());
    }).catch(function (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      var message = getUiText("目录加载失败，请稍后重试。", "The project directory failed to load. Please retry later.");
      if (error && error.name === "AbortError") {
        message = getUiText("目录请求超时，请检查后端状态后重试。", "The project request timed out. Check backend availability and retry.");
      } else if (error && typeof error.message === "string" && error.message.trim()) {
        message = error.message.trim();
      }

      showError(message);
    }).finally(function () {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  }

  function applyFromControls(options) {
    var nextOptions = options || {};
    var state = readStateFromControls();
    setView(state.view);

    if (nextOptions.syncUrl) {
      writeStateToUrl(state);
    }

    if (nextOptions.refetch) {
      fetchProjects(state);
      return;
    }

    if (!allProjects.length && nextOptions.allowEmptyRender !== true) {
      return;
    }

    renderRecords(state);
  }

  function resetControls() {
    writeStateToControls(defaultState);
    applyFromControls({
      syncUrl: true,
      refetch: true
    });
  }

  searchInput.addEventListener("input", function () {
    applyFromControls({
      syncUrl: true,
      refetch: false
    });
  });

  sortSelect.addEventListener("change", function () {
    applyFromControls({
      syncUrl: true,
      refetch: false
    });
  });

  stageSelect.addEventListener("change", function () {
    applyFromControls({
      syncUrl: true,
      refetch: false
    });
  });

  sourceSelect.addEventListener("change", function () {
    applyFromControls({
      syncUrl: true,
      refetch: false
    });
  });

  typeSelect.addEventListener("change", function () {
    applyFromControls({
      syncUrl: true,
      refetch: false
    });
  });

  featuredOnlyInput.addEventListener("change", function () {
    applyFromControls({
      syncUrl: true,
      refetch: true
    });
  });

  clearButton.addEventListener("click", resetControls);

  retryButton.addEventListener("click", function () {
    applyFromControls({
      syncUrl: true,
      refetch: true
    });
  });

  viewButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
    button.addEventListener("click", function () {
      setView(button.getAttribute("data-view-mode") || "grid");
      applyFromControls({
        syncUrl: true,
        refetch: false
      });
    });
  });

  window.addEventListener("popstate", function () {
    var nextState = readStateFromUrl();
    writeStateToControls(nextState);

    if (getFetchKey(nextState) !== lastFetchKey) {
      fetchProjects(nextState);
      return;
    }

    applyFromControls({
      syncUrl: false,
      refetch: false,
      allowEmptyRender: true
    });
  });
  window.addEventListener("ll-ui-locale-change", function () {
    currentUiLocale = normalizeUiLocale(readUiLocale());
    applyStaticCatalogCopy();

    if (allProjects.length > 0) {
      renderTagCloud(allProjects);
      renderRecords(readStateFromControls());
      return;
    }

    if (!errorState.hidden) {
      showError(errorDetail ? toText(errorDetail.textContent) : getUiText("目录加载失败，请稍后重试。", "The project directory failed to load. Please retry later."));
      return;
    }

    if (!emptyState.hidden) {
      showEmpty(toText(emptyState.textContent) || getUiText("当前筛选条件无匹配项。可以放宽关键词或重置筛选。", "No projects match the current filters. Try loosening the query or clearing filters."));
      return;
    }

    if (!loadingState.hidden) {
      showLoading();
    }
  });

  var initialState = readStateFromUrl();
  applyStaticCatalogCopy();
  writeStateToControls(initialState);
  writeStateToUrl(initialState);
  fetchProjects(initialState);
})();
