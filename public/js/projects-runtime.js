(function () {
  "use strict";

  if (window.__LL_PROJECTS_RUNTIME__) {
    return;
  }

  function toText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function toRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value;
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

  function normalizeTextArray(rawItems, keys) {
    if (!Array.isArray(rawItems)) {
      return [];
    }

    var seen = {};
    var items = [];

    rawItems.forEach(function (entry) {
      var text = toText(entry);
      if (!text) {
        var record = toRecord(entry);
        if (record && Array.isArray(keys)) {
          for (var i = 0; i < keys.length; i += 1) {
            text = toText(record[keys[i]]);
            if (text) {
              break;
            }
          }
        }
      }

      if (!text) {
        return;
      }

      var dedupeKey = text.toLowerCase();
      if (seen[dedupeKey]) {
        return;
      }

      seen[dedupeKey] = true;
      items.push(text);
    });

    return items;
  }

  function normalizeTags(rawTags) {
    return normalizeTextArray(rawTags, ["name", "label", "tag", "slug", "value"]);
  }

  function normalizeHighlights(rawHighlights) {
    return normalizeTextArray(rawHighlights, ["text", "title", "content", "summary", "name"]);
  }

  function normalizeRepositories(rawValue) {
    var payload = toRecord(rawValue);
    var rawItems = [];

    if (Array.isArray(rawValue)) {
      rawItems = rawItems.concat(rawValue);
    }

    if (payload) {
      if (Array.isArray(payload.items)) {
        rawItems = rawItems.concat(payload.items);
      }
      if (Array.isArray(payload.repositories)) {
        rawItems = rawItems.concat(payload.repositories);
      }
      if (Array.isArray(payload.repos)) {
        rawItems = rawItems.concat(payload.repos);
      }
    }

    var seen = {};
    var repositories = [];

    rawItems.forEach(function (entry, index) {
      var record = toRecord(entry);
      if (!record) {
        return;
      }

      var fullName = toText(record.full_name || record.repo_full_name || record.repository_full_name);
      var name = toText(record.name || record.repo_name);
      if (!name && fullName) {
        var parts = fullName.split("/");
        name = parts[parts.length - 1] || "";
      }

      var url = toText(record.url || record.repo_url || record.html_url || record.homepage);
      var visibility = toText(record.visibility);
      var isPrimary = record.is_primary === true || record.primary === true;

      if (!name && !fullName && !url) {
        return;
      }

      var dedupeKey = (fullName || url || (name + "-" + index)).toLowerCase();
      if (seen[dedupeKey]) {
        return;
      }

      seen[dedupeKey] = true;
      repositories.push({
        name: name || fullName || ("repository-" + (index + 1)),
        fullName: fullName || "",
        url: url || "",
        visibility: visibility || "",
        isPrimary: isPrimary
      });
    });

    if (repositories.length > 0 && !repositories.some(function (item) { return item.isPrimary; })) {
      repositories[0].isPrimary = true;
    }

    return repositories;
  }

  function normalizeLinkType(value) {
    var normalized = toText(value).toLowerCase().replace(/[_\s]+/g, "-");
    return normalized || "";
  }

  function buildLinkLabel(type) {
    var normalizedType = normalizeLinkType(type);
    if (normalizedType === "primary" || normalizedType === "homepage" || normalizedType === "main" || normalizedType === "home") return "Primary";
    if (normalizedType === "repo" || normalizedType === "repository" || normalizedType === "github") return "Repository";
    if (normalizedType === "demo" || normalizedType === "preview") return "Demo";
    if (normalizedType === "docs" || normalizedType === "documentation") return "Docs";
    if (normalizedType === "notes" || normalizedType === "note") return "Notes";
    return "Link";
  }

  function normalizeLinkItems(rawLinks) {
    var linksRecord = toRecord(rawLinks);
    var rawItems = [];

    if (Array.isArray(rawLinks)) {
      rawItems = rawItems.concat(rawLinks);
    }

    if (linksRecord) {
      if (Array.isArray(linksRecord.items)) {
        rawItems = rawItems.concat(linksRecord.items);
      }

      if (Array.isArray(linksRecord.links)) {
        rawItems = rawItems.concat(linksRecord.links);
      }

      [
        { type: "primary", key: "primary" },
        { type: "repo", key: "repo" },
        { type: "demo", key: "demo" },
        { type: "docs", key: "docs" },
        { type: "notes", key: "notes" }
      ].forEach(function (entry) {
        var href = toText(linksRecord[entry.key]);
        if (!href) {
          return;
        }

        rawItems.push({
          type: entry.type,
          href: href
        });
      });
    }

    var seen = {};
    var items = [];

    rawItems.forEach(function (entry, index) {
      if (typeof entry === "string") {
        var stringHref = toText(entry);
        if (!stringHref) {
          return;
        }

        var stringKey = stringHref.toLowerCase();
        if (seen[stringKey]) {
          return;
        }

        seen[stringKey] = true;
        items.push({
          key: "link-" + index,
          label: "Link",
          href: stringHref,
          type: ""
        });
        return;
      }

      var record = toRecord(entry);
      if (!record) {
        return;
      }

      var href = toText(record.href || record.url || record.link || record.value);
      if (!href) {
        return;
      }

      var dedupeKey = href.toLowerCase();
      if (seen[dedupeKey]) {
        return;
      }

      seen[dedupeKey] = true;
      var type = normalizeLinkType(record.type);
      var label = toText(record.label || record.title || record.name) || buildLinkLabel(type);

      items.push({
        key: (type || "link") + "-" + index,
        label: label,
        href: href,
        type: type
      });
    });

    return items;
  }

  function pickLinkByType(items, types) {
    var accepted = {};
    types.forEach(function (type) {
      accepted[type] = true;
    });

    var matched = items.find(function (item) {
      return item.type && accepted[item.type] === true;
    });

    return matched ? matched.href : "";
  }

  function normalizeLinks(rawLinks, repositories) {
    var linksRecord = toRecord(rawLinks) || {};
    var linkItems = normalizeLinkItems(rawLinks);
    var primaryRepository = repositories.find(function (item) { return item.isPrimary; }) || repositories[0] || null;

    var primary = toText(linksRecord.primary);
    var repo = toText(linksRecord.repo);
    var demo = toText(linksRecord.demo);
    var docs = toText(linksRecord.docs);
    var notes = toText(linksRecord.notes);

    if (!primary) {
      primary = pickLinkByType(linkItems, ["primary", "homepage", "home", "main", "default"]);
    }

    if (!repo) {
      repo = pickLinkByType(linkItems, ["repo", "repository", "github"]);
    }

    if (!demo) {
      demo = pickLinkByType(linkItems, ["demo", "preview"]);
    }

    if (!docs) {
      docs = pickLinkByType(linkItems, ["docs", "documentation"]);
    }

    if (!notes) {
      notes = pickLinkByType(linkItems, ["notes", "note"]);
    }

    if (!repo && primaryRepository) {
      repo = primaryRepository.url;
    }

    if (!primary) {
      primary = (linkItems[0] && linkItems[0].href) || repo || "";
    }

    return {
      links: {
        primary: primary,
        repo: repo,
        demo: demo,
        docs: docs,
        notes: notes
      },
      linkItems: linkItems
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

  function resolveSourceUrl(project, fullName, repositories, links) {
    var sourceUrl = toText(project && project.url);
    if (sourceUrl) {
      return sourceUrl;
    }
    if (links && links.repo) {
      return links.repo;
    }

    var primaryRepository = repositories.find(function (item) { return item.isPrimary; }) || repositories[0] || null;
    if (primaryRepository && primaryRepository.url) {
      return primaryRepository.url;
    }

    if (fullName) {
      return "https://github.com/" + fullName;
    }
    return "";
  }

  function normalizeSourceRefs(rawSourceRefs, repositories, links) {
    var sourceRefs = toRecord(rawSourceRefs) || {};
    var primaryRepository = repositories.find(function (item) { return item.isPrimary; }) || repositories[0] || null;

    var repoFullName = toText(sourceRefs.repo_full_name);
    var repoUrl = toText(sourceRefs.repo_url);
    var visibility = toText(sourceRefs.visibility);

    if (!repoFullName && primaryRepository) {
      repoFullName = primaryRepository.fullName;
    }

    if (!repoUrl && primaryRepository) {
      repoUrl = primaryRepository.url;
    }

    if (!repoUrl && links && links.repo) {
      repoUrl = links.repo;
    }

    if (!visibility && primaryRepository) {
      visibility = primaryRepository.visibility;
    }

    return {
      repo_full_name: repoFullName,
      repo_url: repoUrl,
      visibility: visibility
    };
  }

  function normalizeProject(rawProject, index) {
    var project = rawProject && typeof rawProject === "object" ? rawProject : {};
    var repositories = normalizeRepositories(project.repositories);
    var normalizedLinks = normalizeLinks(project.links, repositories);
    var sourceRefs = normalizeSourceRefs(project.source_refs, repositories, normalizedLinks.links);

    var fullName = toText(project.full_name) || toText(sourceRefs.repo_full_name);
    var fallbackName = fullName ? fullName.split("/").pop() : "";
    var name = toText(project.name) || fallbackName || ("project-" + (index + 1));
    var summary = toText(project.summary) || toText(project.description);
    var stage = toText(project.stage) || "unknown";
    var sourceType = toText(project.source_type) || toText(project.source);
    var projectType = toText(project.project_type);
    var tags = normalizeTags(project.tags);
    var stack = normalizeTags(project.stack);
    var links = normalizedLinks.links;
    var slug = toText(project.slug);
    var detailPath = buildDetailPath(project);
    var featuredRank = toInteger(project.featured_rank);
    var pushedAt = toText(project.pushed_at);
    var updatedAt = toText(project.updated_at);
    var isActive = project.is_active === true || stage === "active";
    var archived = project.archived === true || stage === "archived";
    var status = archived ? "archived" : (isActive ? "active" : "inactive");
    var highlights = normalizeHighlights(project.highlights);

    var searchableRepositories = repositories.map(function (repo) {
      return [repo.name, repo.fullName].join(" ");
    }).join(" ");

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
      stack.join(" "),
      highlights.join(" "),
      searchableRepositories
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
      url: resolveSourceUrl(project, fullName, repositories, links),
      description: toText(project.description),
      summary: summary,
      headline: toText(project.headline),
      overview: toText(project.overview),
      stage: stage,
      sourceType: sourceType,
      projectType: projectType,
      stack: stack,
      tags: tags,
      links: links,
      linkItems: normalizedLinks.linkItems,
      repositories: repositories,
      language: toText(project.language),
      stars: toInteger(project.stargazers_count),
      forks: toInteger(project.forks_count),
      visibility: toText(project.visibility),
      source: toText(project.source),
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
      highlights: highlights,
      sourceRefs: sourceRefs,
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
          var detail = toText(body.detail) || toText(body.error && body.error.message) || toText(body.error && body.error.code);
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
