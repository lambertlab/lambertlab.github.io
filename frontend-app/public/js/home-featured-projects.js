(function () {
  "use strict";

  var featuredRoot = document.querySelector("[data-home-featured-projects]");
  var projectsRuntime = window.__LL_PROJECTS_RUNTIME__;

  if (!featuredRoot || !projectsRuntime || typeof projectsRuntime.fetchProjectsList !== "function") {
    return;
  }

  var slots = Array.prototype.slice.call(featuredRoot.querySelectorAll("[data-home-featured-slot]"));
  if (!slots.length) {
    return;
  }

  function toText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function setChip(node, text, tone) {
    if (!node) {
      return;
    }

    var value = toText(text);
    node.textContent = value || "Pending";
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
      rankNode.textContent = project.featuredRank ? ("Featured #" + project.featuredRank) : "Featured Project";
    }
    if (nameNode) {
      nameNode.textContent = project.name || "Untitled Project";
    }
    if (summaryNode) {
      summaryNode.textContent = project.summary || "No summary provided.";
    }

    setChip(stageNode, project.stage || "Unknown", "neutral");
    setChip(typeNode, project.projectType || "Type pending", "neutral");
    setChip(sourceNode, project.sourceType || "Source pending", "neutral");
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
      rankNode.textContent = "Featured Projects";
    }
    if (nameNode) {
      nameNode.textContent = "Featured projects are temporarily unavailable";
    }
    if (summaryNode) {
      summaryNode.textContent = message || "Open the Projects directory to continue browsing.";
    }

    setChip(stageNode, "Catalog", "neutral");
    setChip(typeNode, "Fallback", "neutral");
    setChip(sourceNode, "Retry later", "neutral");
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
      rankNode.textContent = "Project Directory";
    }
    if (nameNode) {
      nameNode.textContent = "Browse the full catalog";
    }
    if (summaryNode) {
      summaryNode.textContent = "更多项目可在目录页查看，并统一进入详情主路径。";
    }

    setChip(stageNode, "Catalog", "neutral");
    setChip(typeNode, "Browse all", "neutral");
    setChip(sourceNode, "Projects", "neutral");
  }

  projectsRuntime.fetchProjectsList({
    featuredOnly: true,
    limit: 3
  }).then(function (result) {
    var projects = Array.isArray(result.projects) ? result.projects : [];

    if (!projects.length) {
      throw new Error("No featured projects found.");
    }

    slots.forEach(function (slot, index) {
      var project = projects[index];
      if (project) {
        updateSlot(slot, project);
      } else {
        setUnusedState(slot);
      }
    });
  }).catch(function (error) {
    var message = "Open the Projects directory to keep browsing.";
    if (error && typeof error.message === "string" && error.message.trim() && error.message !== "No featured projects found.") {
      message = error.message.trim();
    }

    slots.forEach(function (slot) {
      setErrorState(slot, message);
    });
  });
})();
