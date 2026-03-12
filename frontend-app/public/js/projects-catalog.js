(function () {
  "use strict";

  var catalogRoot = document.querySelector("[data-project-catalog]");
  if (!catalogRoot) {
    return;
  }

  var searchInput = document.getElementById("project-search");
  var sortSelect = document.getElementById("sort-by");
  var statusSelect = document.getElementById("status-filter");
  var featuredOnlyInput = document.getElementById("featured-only");
  var clearButton = document.getElementById("clear-filters");
  var retryButton = document.getElementById("retry-fetch");
  var grid = catalogRoot.querySelector("[data-project-grid]");
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
  var viewButtons = Array.prototype.slice.call(catalogRoot.querySelectorAll("[data-view-mode]"));

  if (!searchInput || !sortSelect || !statusSelect || !featuredOnlyInput || !clearButton || !retryButton || !grid) {
    return;
  }

  var validSort = {
    recent: true,
    stars: true,
    name: true
  };

  var validStatus = {
    all: true,
    active: true,
    inactive: true,
    archived: true
  };

  var knownDetailPages = {
    "personal-toolbox": "./personal-toolbox/",
    "ai-message-value-triage": "./ai-message-value-triage/"
  };

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
    return parsed.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
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
    return parsed.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function formatNumber(value) {
    var normalized = typeof value === "number" ? value : toInteger(value);
    return normalized.toLocaleString("en-US");
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

  function mapProject(rawProject, index) {
    var project = rawProject && typeof rawProject === "object" ? rawProject : {};
    var fullName = toText(project.full_name);
    var fallbackName = fullName ? fullName.split("/").pop() : "";
    var name = toText(project.name) || fallbackName || ("project-" + (index + 1));
    var sourceUrl = toText(project.url);

    if (!sourceUrl && fullName) {
      sourceUrl = "https://github.com/" + fullName;
    }

    var tags = normalizeTags(project.tags);
    var pushedAt = toText(project.pushed_at);
    var updatedAt = toText(project.updated_at);
    var recencyScore = parseTimeScore(pushedAt) || parseTimeScore(updatedAt);
    var isActive = project.is_active === true;
    var archived = project.archived === true;
    var status = archived ? "archived" : (isActive ? "active" : "inactive");
    var searchText = [
      name,
      fullName,
      toText(project.description),
      toText(project.language),
      tags.join(" ")
    ].join(" ").toLowerCase();

    return {
      index: index,
      id: project.id,
      name: name,
      fullName: fullName,
      url: sourceUrl,
      description: toText(project.description),
      language: toText(project.language),
      stars: toInteger(project.stargazers_count),
      forks: toInteger(project.forks_count),
      visibility: toText(project.visibility),
      source: toText(project.source),
      tags: tags,
      status: status,
      isFeatured: project.is_featured === true,
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
    status: "all",
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
    var status = (params.get("status") || defaultState.status).trim().toLowerCase();
    var featured = toBoolean(params.get("featured"));
    var view = (params.get("view") || defaultState.view).trim().toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(validSort, sort)) {
      sort = defaultState.sort;
    }

    if (!Object.prototype.hasOwnProperty.call(validStatus, status)) {
      status = defaultState.status;
    }

    if (view !== "list") {
      view = "grid";
    }

    return {
      q: q,
      sort: sort,
      status: status,
      featured: featured,
      view: view
    };
  }

  function writeStateToControls(state) {
    searchInput.value = state.q;
    sortSelect.value = state.sort;
    statusSelect.value = state.status;
    featuredOnlyInput.checked = state.featured === true;
    setView(state.view);
  }

  function readStateFromControls() {
    var q = (searchInput.value || "").trim();
    var sort = (sortSelect.value || "").trim().toLowerCase();
    var status = (statusSelect.value || "").trim().toLowerCase();
    var featured = featuredOnlyInput.checked === true;
    var view = getActiveView();

    if (!Object.prototype.hasOwnProperty.call(validSort, sort)) {
      sort = defaultState.sort;
    }

    if (!Object.prototype.hasOwnProperty.call(validStatus, status)) {
      status = defaultState.status;
    }

    return {
      q: q,
      sort: sort,
      status: status,
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

    if (state.status !== defaultState.status) {
      params.set("status", state.status);
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
      if (state.status !== "all" && record.status !== state.status) {
        return false;
      }
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

  function createStatusBadge(status) {
    var badge = document.createElement("span");
    badge.className = "status-pill";

    if (status === "active") {
      badge.classList.add("status-live");
      badge.textContent = "Active";
      return badge;
    }
    if (status === "archived") {
      badge.classList.add("status-beta");
      badge.textContent = "Archived";
      return badge;
    }

    badge.classList.add("status-lab");
    badge.textContent = "Inactive";
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

  function createProjectCard(record) {
    var article = document.createElement("article");
    article.className = "project-card";
    article.setAttribute("data-status", record.status);

    var top = document.createElement("div");
    top.className = "project-top";

    var title = document.createElement("h3");
    title.className = "project-name";
    var titleLink = document.createElement("a");
    titleLink.textContent = record.name;
    titleLink.href = record.url || "#";
    if (!record.url) {
      titleLink.setAttribute("aria-disabled", "true");
    } else if (/^https?:\/\//i.test(record.url)) {
      titleLink.target = "_blank";
      titleLink.rel = "noreferrer";
    }
    title.appendChild(titleLink);
    top.appendChild(title);
    top.appendChild(createStatusBadge(record.status));
    article.appendChild(top);

    var description = record.description || "No description provided.";
    article.appendChild(createTextNodeWithClass("p", "project-desc", description));

    var tagsWrap = document.createElement("div");
    tagsWrap.className = "project-tags";
    if (record.tags.length) {
      record.tags.slice(0, 4).forEach(function (tag) {
        tagsWrap.appendChild(createTextNodeWithClass("span", "project-tag", tag));
      });
    } else {
      tagsWrap.appendChild(createTextNodeWithClass("span", "project-tag", "untagged"));
    }
    article.appendChild(tagsWrap);

    var stats = document.createElement("div");
    stats.className = "project-stats";
    stats.appendChild(createStatBox("Pushed", formatDate(record.pushedAt || record.updatedAt)));
    stats.appendChild(createStatBox("Language", record.language || "--"));
    stats.appendChild(createStatBox("Stars", formatNumber(record.stars)));
    article.appendChild(stats);

    var actions = document.createElement("div");
    actions.className = "project-actions";

    if (record.url) {
      var sourceButton = document.createElement("a");
      sourceButton.className = "btn primary";
      sourceButton.href = record.url;
      sourceButton.target = "_blank";
      sourceButton.rel = "noreferrer";
      sourceButton.textContent = "Open Source";
      actions.appendChild(sourceButton);
    } else {
      var disabledButton = document.createElement("a");
      disabledButton.className = "btn primary";
      disabledButton.href = "#";
      disabledButton.setAttribute("aria-disabled", "true");
      disabledButton.textContent = "No Source URL";
      actions.appendChild(disabledButton);
    }

    var detailPath = knownDetailPages[(record.name || "").toLowerCase()];
    if (detailPath) {
      var detailButton = document.createElement("a");
      detailButton.className = "btn";
      detailButton.href = detailPath;
      detailButton.textContent = "View Detail";
      actions.appendChild(detailButton);
    } else if (record.fullName) {
      var fullNameButton = document.createElement("a");
      fullNameButton.className = "btn";
      fullNameButton.href = "https://github.com/" + record.fullName;
      fullNameButton.target = "_blank";
      fullNameButton.rel = "noreferrer";
      fullNameButton.textContent = record.fullName;
      actions.appendChild(fullNameButton);
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
      loadingState.textContent = message || "正在加载目录数据...";
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
    setFetchStatus("目录读取失败，可点击 Retry 重试。");
    if (resultsMeta) {
      resultsMeta.textContent = "Failed to load /projects";
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
      tagCloud.appendChild(createTextNodeWithClass("span", "tag", "No tags"));
      return;
    }

    orderedTags.forEach(function (tag) {
      var chip = createTextNodeWithClass("span", "tag", tag);
      tagCloud.appendChild(chip);
    });
  }

  function updateSummary(state, visibleCount) {
    var totalCount = allProjects.length;
    var activeCount = allProjects.filter(function (project) {
      return project.status === "active";
    }).length;

    if (resultsMeta) {
      var filterLabel = state.q || state.status !== "all" || state.featured
        ? "Filters active"
        : "All filters";
      var fetchedLabel = fetchedAtValue ? ("Fetched " + formatDateTime(fetchedAtValue)) : "Fetched --";
      resultsMeta.textContent = "Showing " + visibleCount + " of " + totalCount + " entries · " + filterLabel + " · " + fetchedLabel;
    }

    if (totalItemsValue) {
      totalItemsValue.textContent = totalCount + " Projects";
    }

    if (liveItemsValue) {
      liveItemsValue.textContent = activeCount + " Active";
    }

    if (lastSyncValue) {
      lastSyncValue.textContent = fetchedAtValue ? formatDateTime(fetchedAtValue) : "--";
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
      showEmpty("后端返回空目录（count=0）。请先同步项目数据后重试。");
      setFetchStatus("目录加载成功，但当前无项目数据。");
      return;
    }

    if (sorted.length === 0) {
      showEmpty("当前筛选条件无匹配项。可以放宽关键词或重置筛选。");
      setFetchStatus("目录加载成功，筛选后无匹配项。");
      return;
    }

    showGrid();
    setFetchStatus("目录加载成功，共 " + fetchedCount + " 条；当前展示 " + sorted.length + " 条。");
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

    if (state.featured) {
      params.set("featured_only", "true");
    }

    if (state.status === "all") {
      params.set("include_inactive", "true");
      params.set("include_archived", "true");
    } else if (state.status === "inactive") {
      params.set("include_inactive", "true");
      params.set("include_archived", "false");
    } else if (state.status === "archived") {
      params.set("include_inactive", "true");
      params.set("include_archived", "true");
    }

    return endpoint + "?" + params.toString();
  }

  function parseResponsePayload(payload) {
    if (!payload || payload.ok !== true || !Array.isArray(payload.projects)) {
      throw new Error("`GET /projects` 响应不符合协议（ok/projects）。");
    }

    fetchedCount = toInteger(payload.count);
    if (fetchedCount <= 0) {
      fetchedCount = payload.projects.length;
    }
    fetchedAtValue = toText(payload.fetched_at);
    allProjects = payload.projects.map(mapProject);
  }

  function getFetchKey(state) {
    return state.status + "|" + (state.featured ? "1" : "0");
  }

  function fetchProjects(state) {
    var requestId = ++latestRequestId;
    var runtimeConfig = window.__APP_CONFIG__ || {};
    var timeoutMs = getPositiveInteger(runtimeConfig.REQUEST_TIMEOUT_MS, 3000);
    var url = buildRequestUrl(state);
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId = null;

    showLoading("正在请求 " + url + " ...");
    setFetchStatus("正在读取后端目录数据...");

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

      var message = "目录加载失败，请稍后重试。";
      if (error && error.name === "AbortError") {
        message = "目录请求超时，请检查后端状态后重试。";
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

  statusSelect.addEventListener("change", function () {
    applyFromControls({
      syncUrl: true,
      refetch: true
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

  var initialState = readStateFromUrl();
  writeStateToControls(initialState);
  writeStateToUrl(initialState);
  fetchProjects(initialState);
})();
