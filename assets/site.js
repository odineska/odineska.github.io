/** Initializes the theme, copy controls and current documentation section. */
(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const toast = document.querySelector(".copy-toast");
  const eskaVersionElements = document.querySelectorAll("[data-eska-version]");
  let toastTimer;

  /** Updates the theme control for the active color scheme. */
  const syncThemeButton = () => {
    if (!themeButton) return;

    const isDark = root.dataset.theme === "dark";
    themeButton.setAttribute("aria-label", isDark ? "Включить светлую тему" : "Включить тёмную тему");
    themeButton.setAttribute("aria-pressed", String(isDark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#0d1220" : "#f3f6fc");
  };

  /** Shows a short non-blocking status message. */
  const showToast = (message) => {
    if (!toast) return;

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(hideToast, 1800);
  };

  /** Hides the current status message. */
  function hideToast() {
    toast?.classList.remove("is-visible");
  }

  /** Copies text with a fallback for older browsers. */
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  };

  /** Toggles and persists the selected color theme. */
  const toggleTheme = () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // Theme switching remains available when storage is restricted.
    }
    syncThemeButton();
  };

  /** Connects copy feedback to one command button. */
  const bindCopyButton = (button) => {
    /** Copies this button's command and updates its state. */
    const handleCopy = async () => {
      try {
        await copyText(button.dataset.copy);
        button.dataset.state = "copied";
        button.setAttribute("aria-label", "Команда скопирована");
        showToast("Команда скопирована");

        /** Restores the button's default label. */
        const resetButton = () => {
          delete button.dataset.state;
          button.setAttribute("aria-label", "Копировать команду");
        };

        window.setTimeout(resetButton, 1800);
      } catch {
        showToast("Не удалось скопировать");
      }
    };

    button.addEventListener("click", handleCopy);
  };

  /** Tracks the section at the reading edge without changing the URL or focus. */
  const bindDocsNavigation = () => {
    const toc = document.querySelector(".docs-toc");
    const sidebar = document.querySelector(".docs-sidebar");
    const header = document.querySelector(".site-header");
    if (!toc || !sidebar || !header) return;

    const items = [];
    for (const link of toc.querySelectorAll('a[href^="#"]')) {
      const section = document.getElementById(link.hash.slice(1));
      if (section?.matches(".doc-section")) items.push({ link, section });
    }
    if (!items.length) return;

    const compactLayout = matchMedia("(max-width: 1100px)");
    let currentLink = null;
    let updateQueued = false;

    /** Scrolls only the navigation container, keeping the document stationary. */
    const revealCurrentLink = (link) => {
      const container = compactLayout.matches ? toc : sidebar;
      const bounds = container.getBoundingClientRect();
      const itemBounds = link.getBoundingClientRect();
      const start = compactLayout.matches ? itemBounds.left - bounds.left : itemBounds.top - bounds.top;
      const end = compactLayout.matches ? itemBounds.right - bounds.right : itemBounds.bottom - bounds.bottom;
      const distance = start < 0 ? start - 4 : end > 0 ? end + 4 : 0;
      if (!distance) return;

      container.scrollBy({
        left: compactLayout.matches ? distance : 0,
        top: compactLayout.matches ? 0 : distance,
        behavior: "instant",
      });
    };

    /** Selects the last section above the pinned controls, including the page end. */
    const updateCurrentSection = () => {
      updateQueued = false;
      const readingEdge = header.getBoundingClientRect().height + 24
        + (compactLayout.matches ? sidebar.getBoundingClientRect().height : 0);
      let current = null;

      for (const item of items) {
        if (item.section.getBoundingClientRect().top > readingEdge + 1) break;
        current = item;
      }
      if (Math.ceil(window.scrollY + window.innerHeight) >= root.scrollHeight - 2) {
        current = items.at(-1);
      }

      const nextLink = current?.link ?? null;
      if (nextLink !== currentLink) {
        currentLink?.removeAttribute("aria-current");
        nextLink?.setAttribute("aria-current", "location");
        currentLink = nextLink;
      }
      if (currentLink) revealCurrentLink(currentLink);
    };

    /** Coalesces scroll and layout changes into one update per rendered frame. */
    const queueUpdate = () => {
      if (updateQueued) return;
      updateQueued = true;
      window.requestAnimationFrame(updateCurrentSection);
    };

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    window.addEventListener("hashchange", queueUpdate);
    window.addEventListener("pageshow", queueUpdate);
    window.addEventListener("load", queueUpdate);
    void document.fonts.ready.then(queueUpdate);
    queueUpdate();
  };

  /** Replaces fallback version labels with the latest version published on crates.io. */
  const syncEskaVersion = async () => {
    if (!eskaVersionElements.length) return;

    try {
      const response = await fetch("https://img.shields.io/crates/v/eska.json");
      if (!response.ok) return;

      const payload = await response.json();
      const version = String(payload.value || payload.message || "").replace(/^v/, "");
      if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) return;

      eskaVersionElements.forEach((element) => {
        element.textContent = version;
      });
    } catch {
      // Keep the version embedded in the page when the badge service is unavailable.
    }
  };

  themeButton?.addEventListener("click", toggleTheme);
  document.querySelectorAll("[data-copy]").forEach(bindCopyButton);

  syncThemeButton();
  bindDocsNavigation();
  void syncEskaVersion();
})();
