(function () {
  "use strict";

  var featuredRoot = document.querySelector("[data-home-featured-projects]");
  var projectsRuntime = window.__LL_PROJECTS_RUNTIME__;

  if (!featuredRoot || !projectsRuntime || typeof projectsRuntime.fetchProjectsList !== "function") {
    return;
  }

  var slots = Array.prototype.slice.call(featuredRoot.querySelectorAll("[data-home-featured-slot]"));
  var featuredProjects = [];
  var featuredErrorMessage = "";
  var featuredIsEmpty = false;
  if (!slots.length) {
    return;
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
    return readUiLocale() === "en";
  }

  function getUiText(zhText, enText) {
    return isEnglishUi() ? enText : zhText;
  }

  function toText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function setChip(node, text, tone) {
    if (!node) {
      return;
    }

    var value = toText(text);
    node.textContent = value || getUiText("待补充", "Pending");
    node.setAttribute("data-meta-tone", tone || "neutral");
  }

  function updateSlot(slot, project) {
    if (!slot || !project) {
      return;
    }

    var rankNode = slot.querySelector("[data-project-rank]");
    var nameNode = slot.querySelector("[data-project-name]");
    var summaryNode = slot.querySelector("[data-project-summary]");
    var stageNode = slot.querySelector("[data-project-stage]");
    var typeNode = slot.querySelector("[data-project-type]");
    var sourceNode = slot.querySelector("[data-project-source]");

    slot.href = project.detailPath || "./projects/";
    slot.removeAttribute("target");
    slot.removeAttribute("rel");
    slot.removeAttribute("aria-busy");
    slot.setAttribute("data-featured-state", "ready");

    if (rankNode) {
      rankNode.textContent = project.featuredRank ? (getUiText("精选 #", "Featured #") + project.featuredRank) : getUiText("精选项目", "Featured Project");
    }
    if (nameNode) {
      nameNode.textContent = project.name || getUiText("未命名项目", "Untitled Project");
    }
    if (summaryNode) {
      summaryNode.textContent = project.summary || getUiText("暂未提供摘要。", "No summary provided.");
    }

    setChip(stageNode, project.stage || getUiText("未知", "Unknown"), "neutral");
    setChip(typeNode, project.projectType || getUiText("类型待补充", "Type pending"), "neutral");
    setChip(sourceNode, project.sourceType || getUiText("来源待补充", "Source pending"), "neutral");
  }

  function setCatalogEmptyState(slot) {
    if (!slot) {
      return;
    }

    var rankNode = slot.querySelector("[data-project-rank]");
    var nameNode = slot.querySelector("[data-project-name]");
    var summaryNode = slot.querySelector("[data-project-summary]");
    var stageNode = slot.querySelector("[data-project-stage]");
    var typeNode = slot.querySelector("[data-project-type]");
    var sourceNode = slot.querySelector("[data-project-source]");

    slot.href = "./projects/";
    slot.removeAttribute("target");
    slot.removeAttribute("rel");
    slot.removeAttribute("aria-busy");
    slot.setAttribute("data-featured-state", "empty");

    if (rankNode) {
      rankNode.textContent = getUiText("\u9879\u76ee\u76ee\u5f55", "Project Directory");
    }
    if (nameNode) {
      nameNode.textContent = getUiText("\u6682\u65e0\u9879\u76ee", "No projects yet");
    }
    if (summaryNode) {
      summaryNode.textContent = getUiText("\u5f53\u524d\u4e3a\u4e2d\u6027\u7a7a\u6001\u3002\u53ef\u524d\u5f80 /admin/projects \u521b\u5efa\u9996\u6761\u9879\u76ee\uff0c\u6216\u5728 /admin/sync \u4f7f\u7528 github_user=lambertlab \u5bfc\u5165\u3002", "This is a neutral empty state. Create in /admin/projects, or import with github_user=lambertlab in /admin/sync.");
    }

    setChip(stageNode, getUiText("\u76ee\u5f55\u4e3a\u7a7a", "Empty catalog"), "neutral");
    setChip(typeNode, getUiText("\u53ef\u7ee7\u7eed\u64cd\u4f5c", "Action available"), "neutral");
    setChip(sourceNode, getUiText("\u53ef\u7528\u6536\u5f55\u901a\u9053", "Intake channels"), "neutral");
  }

  function setErrorState(slot, message) {
    if (!slot) {
      return;
    }

    var rankNode = slot.querySelector("[data-project-rank]");
    var nameNode = slot.querySelector("[data-project-name]");
    var summaryNode = slot.querySelector("[data-project-summary]");
    var stageNode = slot.querySelector("[data-project-stage]");
    var typeNode = slot.querySelector("[data-project-type]");
    var sourceNode = slot.querySelector("[data-project-source]");

    slot.href = "./projects/";
    slot.removeAttribute("target");
    slot.removeAttribute("rel");
    slot.removeAttribute("aria-busy");
    slot.setAttribute("data-featured-state", "error");

    if (rankNode) {
      rankNode.textContent = getUiText("精选项目", "Featured Projects");
    }
    if (nameNode) {
      nameNode.textContent = getUiText("精选项目暂时不可用", "Featured projects are temporarily unavailable");
    }
    if (summaryNode) {
      summaryNode.textContent = message || getUiText("打开项目目录继续浏览。", "Open the Projects directory to continue browsing.");
    }

    setChip(stageNode, getUiText("目录", "Catalog"), "neutral");
    setChip(typeNode, getUiText("兜底", "Fallback"), "neutral");
    setChip(sourceNode, getUiText("稍后重试", "Retry later"), "neutral");
  }

  function setUnusedState(slot) {
    if (!slot) {
      return;
    }

    var rankNode = slot.querySelector("[data-project-rank]");
    var nameNode = slot.querySelector("[data-project-name]");
    var summaryNode = slot.querySelector("[data-project-summary]");
    var stageNode = slot.querySelector("[data-project-stage]");
    var typeNode = slot.querySelector("[data-project-type]");
    var sourceNode = slot.querySelector("[data-project-source]");

    slot.href = "./projects/";
    slot.removeAttribute("aria-busy");
    slot.setAttribute("data-featured-state", "idle");

    if (rankNode) {
      rankNode.textContent = getUiText("项目目录", "Project Directory");
    }
    if (nameNode) {
      nameNode.textContent = getUiText("浏览完整目录", "Browse the full catalog");
    }
    if (summaryNode) {
      summaryNode.textContent = getUiText("更多项目可在目录页查看，并统一进入详情主路径。", "More projects are available in the directory, with a shared detail entry path.");
    }

    setChip(stageNode, getUiText("目录", "Catalog"), "neutral");
    setChip(typeNode, getUiText("查看全部", "Browse all"), "neutral");
    setChip(sourceNode, getUiText("项目", "Projects"), "neutral");
  }

  function rerenderFeaturedSlots() {
    if (featuredProjects.length > 0) {
      slots.forEach(function (slot, index) {
        var project = featuredProjects[index];
        if (project) {
          updateSlot(slot, project);
        } else {
          setUnusedState(slot);
        }
      });
      return;
    }

    if (featuredIsEmpty) {
      slots.forEach(function (slot) {
        setCatalogEmptyState(slot);
      });
      return;
    }

    if (featuredErrorMessage) {
      slots.forEach(function (slot) {
        setErrorState(slot, featuredErrorMessage);
      });
    }
  }

  projectsRuntime.fetchProjectsList({
    featuredOnly: true,
    limit: 3
  }).then(function (result) {
    var projects = Array.isArray(result.projects) ? result.projects : [];

    if (!projects.length) {
      featuredProjects = [];
      featuredErrorMessage = "";
      featuredIsEmpty = true;

      slots.forEach(function (slot) {
        setCatalogEmptyState(slot);
      });
      return;
    }

    featuredProjects = projects.slice();
    featuredErrorMessage = "";
    featuredIsEmpty = false;

    slots.forEach(function (slot, index) {
      var project = projects[index];
      if (project) {
        updateSlot(slot, project);
      } else {
        setUnusedState(slot);
      }
    });
  }).catch(function (error) {
    var message = getUiText("打开项目目录继续浏览。", "Open the Projects directory to keep browsing.");
    if (error && typeof error.message === "string" && error.message.trim() && error.message !== "No featured projects found.") {
      message = error.message.trim();
    }

    featuredProjects = [];
    featuredErrorMessage = message;
    featuredIsEmpty = false;

    slots.forEach(function (slot) {
      setErrorState(slot, message);
    });
  });

  window.addEventListener("ll-ui-locale-change", rerenderFeaturedSlots);
})();
