/**
 * The place that knows which page is open.
 *
 * The dashboard is a separate bundle that is only loaded when it is needed.
 * Both the shell and the dashboard talk to each other through this file, so
 * neither of them has to know about the other.
 */

const listeners = new Set();

let currentPath =
  typeof window !== 'undefined' ? window.location.pathname || '/' : '/';

function notify() {
  listeners.forEach((listener) => listener(currentPath));
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    currentPath = window.location.pathname || '/';
    notify();
  });
}

/**
 * The path that is open right now.
 * @returns {string}
 */
export function getPath() {
  return currentPath;
}

/**
 * Listen for changes of the path.
 * @param {(path: string) => void} listener
 * @returns {() => void} a function that stops listening
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Go to another page without reloading the site.
 * @param {string} to
 */
export function navigate(to) {
  if (typeof window === 'undefined' || !to) return;
  window.history.pushState(null, '', to);
  currentPath = to.split('?')[0];
  if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  notify();
}
