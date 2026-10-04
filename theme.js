/* Theme switcher: Normal (default look), Light, Dark. The choice is remembered in this browser. */
(function () {
  const KEY = "typingmaster-theme", root = document.documentElement;
  const btn = document.getElementById("themeButton"), menu = document.getElementById("themeMenu");
  if (!btn || !menu) return;

  const ICONS = {
    normal: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };
  const LABELS = { normal: "Normal", light: "Light", dark: "Dark" };
  const options = [...menu.querySelectorAll("[data-theme-choice]")];
  menu.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = ICONS[el.dataset.icon]));

  function apply(theme) {
    if (!ICONS[theme]) theme = "normal";
    if (theme === "normal") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
    btn.innerHTML = ICONS[theme];
    btn.setAttribute("aria-label", "Theme: " + LABELS[theme] + ". Change theme");
    btn.title = "Theme: " + LABELS[theme];
    options.forEach((o) => o.setAttribute("aria-checked", String(o.dataset.themeChoice === theme)));
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }
  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  }

  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(menu.hidden); });
  options.forEach((o) => o.addEventListener("click", () => { apply(o.dataset.themeChoice); setOpen(false); btn.focus(); }));
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });

  let saved = "normal";
  try { saved = localStorage.getItem(KEY) || "normal"; } catch (e) {}
  apply(saved);
})();
