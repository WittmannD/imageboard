// Mirrors the inline bootstrap script in imageboard-client's root.tsx <Layout>:
// picks the theme before first paint so there is no flash of the wrong one.
export const darkModeScript = `
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.className = theme;
  } catch (_) {}
})();
`;
