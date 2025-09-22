export function applyTheme(theme: string) {
  document
    .querySelectorAll("link[data-theme]")
    .forEach((link) => link.remove());
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `/themes/${theme}.css`;
  link.setAttribute("data-theme", theme);
  document.head.appendChild(link);
}
