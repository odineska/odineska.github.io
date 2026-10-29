/** Applies the saved theme before styles render, with the Prism palette as default. */
(() => {
  let theme = "dark";

  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") theme = savedTheme;
  } catch {
    // Storage restrictions must not prevent the page from rendering.
  }

  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content", theme === "dark" ? "#0d1220" : "#f3f6fc"
  );
})();
