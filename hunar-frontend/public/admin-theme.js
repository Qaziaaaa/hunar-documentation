(function () {
  try {
    var isAdmin = /\/admin(\/|$)/.test(location.pathname);
    var t = localStorage.getItem("workerfix.admin.theme") || "system";
    var dark =
      isAdmin &&
      (t === "dark" ||
        (t !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches));
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
