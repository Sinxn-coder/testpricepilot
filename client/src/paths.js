export const APP_BASE = import.meta.env.BASE_URL || "/";

export function appPath(path = "") {
  if (!path) return APP_BASE;
  if (path.startsWith("#") || path.startsWith("mailto:") || path.startsWith("http")) {
    return path;
  }

  const base = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

export function appHashPath(route = "") {
  const base = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;
  const cleanRoute = route.replace(/^#?\//, "");
  return `${base}#/${cleanRoute}`;
}

export function currentRoute() {
  if (window.location.hash.startsWith("#/")) {
    return `/${window.location.hash.slice(2)}`;
  }

  const basePath = new URL(APP_BASE, window.location.origin).pathname;
  let path = window.location.pathname;

  if (basePath !== "/" && path.startsWith(basePath)) {
    path = `/${path.slice(basePath.length)}`;
  }

  return path || "/";
}
