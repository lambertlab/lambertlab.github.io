(function () {
  "use strict";

  if (window.__LL_PROJECTS_RUNTIME__) {
    return;
  }

  function toText(value) {
    return typeof value === "string" ? value.trim() : "";
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

  function normalizeApiBase(value) {
    if (typeof value !== "string") {
      return "";
    }

    var trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.endsWith("/")) {
      return trimmed.slice(0, -1);
    }

    return trimmed;
  }

  function normalizeTags(rawTags) {
    if (!Array.isArray(rawTags)) {
      return [];
    }

    var seen = {};
    var tags = [];

    rawTags.forEach(function (item) {
      var tag = toText(item);
      if (!tag) {
        return;
      }

      var normalizedKey = tag.toLowerCase();
      if (seen[normalizedKey]) {
        return;
      }

      seen[normalizedKey] = true;
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

  function buildDetailPath(rawProject) {
    var canonicalPath = toText(rawProject && rawProject.canonical_path);
    if (canonicalPath) {
      if (canonicalPath.charAt(0) !== "/") {
        canonicalPath = "/" + canonicalPath;
      }
      return canonicalPath.endsWith("/") ? canonicalPath : (canonicalPath + "/");
    }

    var slug = toText(rawProject && rawProject.slug);
    if (!slug) {
      return "";
    }

    return "/projects/" + encodeURIComponent(slug) + "/";
  }

  function resolveSourceUrl(project, fullName) {
    var sourceUrl = toText(project && project.url);
    if (sourceUrl) {
      return sourceUrl;
    }
    if (fullName) {
      return "https://github.com/" + fullName;
    }
    return "";
  }

  function normalizeProject(rawProject, index) {
    var project = rawProject && typeof rawProject === "object" ? rawProject : {};
    var fullName = toText(project.full_name);
    var fallbackName = fullName ? fullName.split("/").pop() : "";
    var name = toText(project.name) || fallbackName || ("project-" + (index + 1));
    var summary = toText(project.summary) || toText(project.description);
    var stage = toText(project.stage) || "unknown";
    var sourceType = toText(project.source_type) || toText(project.source);
    var projectType = toText(project.project_type);
    var tags = normalizeTags(project.tags);
    var stack = normalizeTags(project.stack);
    var links = normalizeLinks(project.links);
    var slug = toText(project.slug);
    var detailPath = buildDetailPath(project);
    var featuredRank = toInteger(project.featured_rank);
    var pushedAt = toText(project.pushed_at);
    var updatedAt = toText(project.updated_at);
    var isActive = project.is_active === true;
    var archived = project.archived === true;
    var status = archived ? "archived" : (isActive ? "active" : "inactive");
    var searchText = [
      name,
      fullName,
      summary,
      toText(project.description),
      toText(project.language),
      stage,
      sourceType,
      projectType,
      slug,
      tags.join(" "),
      stack.join(" ")
    ].join(" ").toLowerCase();

    return {
      index: index,
      id: project.id,
      projectKey: toText(project.project_key),
      slug: slug,
      canonicalPath: detailPath,
      detailPath: detailPath,
      name: name,
      fullName: fullName,
      url: resolveSourceUrl(project, fullName),
      description: toText(project.description),
      summary: summary,
      headline: toText(project.headline),
      overview: toText(project.overview),
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
      featuredRank: featuredRank > 0 ? featuredRank : null,
      isActive: isActive,
      archived: archived,
      pushedAt: pushedAt,
      updatedAt: updatedAt,
      syncedAt: toText(project.synced_at),
      recencyScore: parseTimeScore(updatedAt) || parseTimeScore(pushedAt),
      statusNote: toText(project.status_note),
      highlights: Array.isArray(project.highlights) ? project.highlights.slice() : [],
      sourceRefs: project.source_refs && typeof project.source_refs === "object" ? project.source_refs : {},
      searchText: searchText
    };
  }

  function buildApiUrl(pathname, params) {
    var runtimeConfig = window.__APP_CONFIG__ || {};
    var configuredBase = normalizeApiBase(runtimeConfig.API_BASE);
    var origin = (window.location && window.location.origin) || "";
    var base = configuredBase || origin;
    var url = base + pathname;

    if (!params) {
      return url;
    }

    var search = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (value === null || value === undefined || value === "") {
        return;
      }
      search.set(key, String(value));
    });

    var query = search.toString();
    return query ? (url + "?" + query) : url;
  }

  function fetchJson(url, timeoutMs) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timerId = null;

    if (controller) {
      timerId = window.setTimeout(function () {
        controller.abort();
      }, timeoutMs);
    }

    return fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) {
        return response.json().catch(function () {
          return {};
        }).then(function (body) {
          var detail = toText(body.detail);
          throw new Error(detail || ("HTTP_" + response.status));
        });
      }
      return response.json();
    }).finally(function () {
      if (timerId) {
        clearTimeout(timerId);
      }
    });
  }

  function getTimeoutMs() {
    var runtimeConfig = window.__APP_CONFIG__ || {};
    return getPositiveInteger(runtimeConfig.REQUEST_TIMEOUT_MS, 3000);
  }

  function fetchProjectsList(options) {
    var params = Object.assign({}, options || {});
    var featuredOnly = params.featuredOnly === true;
    delete params.featuredOnly;

    var pathname = featuredOnly ? "/projects/featured" : "/projects";
    var url = buildApiUrl(pathname, params);

    return fetchJson(url, getTimeoutMs()).then(function (payload) {
      if (!payload || payload.ok !== true || !Array.isArray(payload.projects)) {
        throw new Error("Projects payload is invalid.");
      }

      return {
        payload: payload,
        projects: payload.projects.map(normalizeProject)
      };
    });
  }

  function fetchProjectDetail(slug) {
    var value = toText(slug);
    if (!value) {
      return Promise.reject(new Error("Project slug is required."));
    }

    var url = buildApiUrl("/projects/" + encodeURIComponent(value), null);
    return fetchJson(url, getTimeoutMs()).then(function (payload) {
      if (!payload || payload.ok !== true || !payload.project || typeof payload.project !== "object") {
        throw new Error("Project detail payload is invalid.");
      }

      return {
        payload: payload,
        project: normalizeProject(payload.project, 0)
      };
    });
  }

  window.__LL_PROJECTS_RUNTIME__ = {
    toText: toText,
    normalizeProject: normalizeProject,
    buildDetailPath: buildDetailPath,
    fetchProjectsList: fetchProjectsList,
    fetchProjectDetail: fetchProjectDetail
  };
})();
