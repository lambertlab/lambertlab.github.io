(function () {
  "use strict";

  var catalogRoot = document.querySelector("[data-project-catalog]");
  if (!catalogRoot) {
    return;
  }

  var searchInput = document.getElementById("project-search");
  var sortSelect = document.getElementById("sort-by");
  var statusSelect = document.getElementById("status-filter");
  var clearButton = document.getElementById("clear-filters");
  var grid = catalogRoot.querySelector("[data-project-grid]");
  var resultsMeta = catalogRoot.querySelector("[data-results-meta]");
  var emptyState = catalogRoot.querySelector("[data-empty-state]");
  var totalItemsValue = catalogRoot.querySelector("[data-total-items]");
  var liveItemsValue = catalogRoot.querySelector("[data-live-items]");
  var typeInputs = Array.prototype.slice.call(catalogRoot.querySelectorAll("[data-filter-type]"));
  var yearInputs = Array.prototype.slice.call(catalogRoot.querySelectorAll("[data-filter-year]"));
  var viewButtons = Array.prototype.slice.call(catalogRoot.querySelectorAll("[data-view-mode]"));

  if (!searchInput || !sortSelect || !statusSelect || !clearButton || !grid) {
    return;
  }

  var allCards = Array.prototype.slice.call(grid.querySelectorAll(".project-card"));
  if (!allCards.length) {
    return;
  }

  var validSort = {
    recent: true,
    downloads: true,
    name: true
  };

  var validStatus = {
    all: true,
    live: true,
    beta: true,
    lab: true
  };

  function parseCompactNumber(rawValue) {
    if (typeof rawValue !== "string") {
      return 0;
    }

    var value = rawValue.trim().toLowerCase();
    if (!value) {
      return 0;
    }

    if (value.slice(-1) === "k") {
      var asFloat = parseFloat(value.slice(0, -1));
      if (Number.isNaN(asFloat)) {
        return 0;
      }
      return Math.round(asFloat * 1000);
    }

    var integer = parseInt(value, 10);
    if (Number.isNaN(integer)) {
      return 0;
    }
    return integer;
  }

  function parseUpdatedScore(rawValue) {
    if (typeof rawValue !== "string") {
      return 0;
    }

    var match = rawValue.trim().match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      return 0;
    }

    var year = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    if (Number.isNaN(year) || Number.isNaN(month)) {
      return 0;
    }

    return year * 100 + month;
  }

  function normalizeList(list, allowedMap) {
    var seen = {};
    var result = [];

    list.forEach(function (item) {
      if (typeof item !== "string") {
        return;
      }
      var value = item.trim().toLowerCase();
      if (!value || !Object.prototype.hasOwnProperty.call(allowedMap, value) || seen[value]) {
        return;
      }
      seen[value] = true;
      result.push(value);
    });

    return result;
  }

  function buildAllowedMap(inputs) {
    return inputs.reduce(function (map, input) {
      var value = (input.value || "").trim().toLowerCase();
      if (value) {
        map[value] = true;
      }
      return map;
    }, {});
  }

  var allowedTypes = buildAllowedMap(typeInputs);
  var allowedYears = buildAllowedMap(yearInputs);

  var defaultState = {
    q: "",
    sort: "recent",
    status: "all",
    types: normalizeList(typeInputs.map(function (input) { return input.value; }), allowedTypes),
    years: normalizeList(yearInputs.map(function (input) { return input.value; }), allowedYears),
    view: "grid"
  };

  var cardRecords = allCards.map(function (card, index) {
    var titleNode = card.querySelector(".project-name a");
    var descNode = card.querySelector(".project-desc");
    var tagNodes = Array.prototype.slice.call(card.querySelectorAll(".project-tag"));
    var statusNode = card.querySelector(".status-pill");
    var statValues = Array.prototype.slice.call(card.querySelectorAll(".stat-value"));

    var title = titleNode ? titleNode.textContent.trim() : "";
    var description = descNode ? descNode.textContent.trim() : "";
    var tags = tagNodes.map(function (node) { return node.textContent.trim(); });

    var status = (card.getAttribute("data-status") || (statusNode ? statusNode.textContent : "") || "").trim().toLowerCase();
    var type = (card.getAttribute("data-type") || (statValues[1] ? statValues[1].textContent : "") || "").trim().toLowerCase().replace(/\s+/g, "-");
    var year = (card.getAttribute("data-year") || (statValues[0] ? statValues[0].textContent.slice(0, 4) : "") || "").trim();
    var updated = (card.getAttribute("data-updated") || (statValues[0] ? statValues[0].textContent : "") || "").trim();
    var downloadsRaw = (card.getAttribute("data-downloads") || (statValues[2] ? statValues[2].textContent : "") || "").trim();

    var searchText = [
      title,
      description,
      tags.join(" "),
      (card.getAttribute("data-keywords") || "")
    ].join(" ").toLowerCase();

    return {
      card: card,
      index: index,
      title: title,
      status: status,
      type: type,
      year: year,
      updatedScore: parseUpdatedScore(updated),
      downloads: parseCompactNumber(downloadsRaw),
      searchText: searchText
    };
  });

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
    var view = (params.get("view") || defaultState.view).trim().toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(validSort, sort)) {
      sort = defaultState.sort;
    }

    if (!Object.prototype.hasOwnProperty.call(validStatus, status)) {
      status = defaultState.status;
    }

    var types = defaultState.types.slice();
    if (params.has("types")) {
      types = normalizeList((params.get("types") || "").split(","), allowedTypes);
    }

    var years = defaultState.years.slice();
    if (params.has("years")) {
      years = normalizeList((params.get("years") || "").split(","), allowedYears);
    }

    if (view !== "list") {
      view = "grid";
    }

    return {
      q: q,
      sort: sort,
      status: status,
      types: types,
      years: years,
      view: view
    };
  }

  function writeStateToControls(state) {
    searchInput.value = state.q;
    sortSelect.value = state.sort;
    statusSelect.value = state.status;

    var activeTypeMap = state.types.reduce(function (map, value) {
      map[value] = true;
      return map;
    }, {});

    typeInputs.forEach(function (input) {
      var key = (input.value || "").trim().toLowerCase();
      input.checked = !!activeTypeMap[key];
    });

    var activeYearMap = state.years.reduce(function (map, value) {
      map[value] = true;
      return map;
    }, {});

    yearInputs.forEach(function (input) {
      var key = (input.value || "").trim().toLowerCase();
      input.checked = !!activeYearMap[key];
    });

    setView(state.view);
  }

  function readStateFromControls() {
    var q = (searchInput.value || "").trim();
    var sort = (sortSelect.value || "").trim().toLowerCase();
    var status = (statusSelect.value || "").trim().toLowerCase();
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
      types: normalizeList(typeInputs.filter(function (input) { return input.checked; }).map(function (input) { return input.value; }), allowedTypes),
      years: normalizeList(yearInputs.filter(function (input) { return input.checked; }).map(function (input) { return input.value; }), allowedYears),
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

    if (state.types.length !== defaultState.types.length) {
      params.set("types", state.types.join(","));
    }

    if (state.years.length !== defaultState.years.length) {
      params.set("years", state.years.join(","));
    }

    if (state.view !== defaultState.view) {
      params.set("view", state.view);
    }

    var next = params.toString();
    var targetUrl = next ? (window.location.pathname + "?" + next) : window.location.pathname;
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

  function filterRecords(state) {
    return cardRecords.filter(function (record) {
      if (state.status !== "all" && record.status !== state.status) {
        return false;
      }

      if (state.types.length && state.types.indexOf(record.type) === -1) {
        return false;
      }

      if (state.types.length === 0) {
        return false;
      }

      if (state.years.length && state.years.indexOf(record.year) === -1) {
        return false;
      }

      if (state.years.length === 0) {
        return false;
      }

      return matchSearch(record, state.q);
    });
  }

  function sortRecords(records, sortMode) {
    var sorted = records.slice();

    sorted.sort(function (a, b) {
      if (sortMode === "downloads") {
        if (b.downloads !== a.downloads) {
          return b.downloads - a.downloads;
        }
      } else if (sortMode === "name") {
        var byName = a.title.localeCompare(b.title, "en", { sensitivity: "base" });
        if (byName !== 0) {
          return byName;
        }
      } else {
        if (b.updatedScore !== a.updatedScore) {
          return b.updatedScore - a.updatedScore;
        }
      }

      return a.index - b.index;
    });

    return sorted;
  }

  function render(records, state) {
    var visibleCards = records.map(function (record) { return record.card; });
    var visibleMap = visibleCards.reduce(function (map, card) {
      map.set(card, true);
      return map;
    }, new Map());

    allCards.forEach(function (card) {
      card.hidden = !visibleMap.has(card);
    });

    records.forEach(function (record) {
      grid.appendChild(record.card);
    });

    var total = cardRecords.length;
    var visible = records.length;
    var activeLive = records.filter(function (record) {
      return record.status === "live";
    }).length;

    if (resultsMeta) {
      var filterState = (state.q || state.status !== "all" || state.types.length !== defaultState.types.length || state.years.length !== defaultState.years.length)
        ? "Filters active"
        : "All filters";
      resultsMeta.textContent = "Showing " + visible + " of " + total + " entries · " + filterState;
    }

    if (totalItemsValue) {
      totalItemsValue.textContent = visible + " / " + total + " Visible";
    }

    if (liveItemsValue) {
      liveItemsValue.textContent = activeLive + " Live";
    }

    if (emptyState) {
      emptyState.hidden = visible > 0;
    }
  }

  function applyFromControls(syncUrl) {
    var state = readStateFromControls();
    setView(state.view);

    var filtered = filterRecords(state);
    var sorted = sortRecords(filtered, state.sort);
    render(sorted, state);

    if (syncUrl) {
      writeStateToUrl(state);
    }
  }

  function resetControls() {
    writeStateToControls(defaultState);
    applyFromControls(true);
  }

  searchInput.addEventListener("input", function () {
    applyFromControls(true);
  });

  sortSelect.addEventListener("change", function () {
    applyFromControls(true);
  });

  statusSelect.addEventListener("change", function () {
    applyFromControls(true);
  });

  typeInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      applyFromControls(true);
    });
  });

  yearInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      applyFromControls(true);
    });
  });

  clearButton.addEventListener("click", resetControls);

  viewButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
    button.addEventListener("click", function () {
      setView(button.getAttribute("data-view-mode") || "grid");
      applyFromControls(true);
    });
  });

  var initialState = readStateFromUrl();
  writeStateToControls(initialState);
  applyFromControls(true);
})();
