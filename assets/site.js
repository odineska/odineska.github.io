/** Initializes color theme and command-copy interactions. */
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
  void syncEskaVersion();
})();
