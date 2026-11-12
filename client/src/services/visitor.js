/**
 * A small number that says "this is the same visitor".
 *
 * It is used for the counting of views and clicks, so that people behind the
 * same address (an office, a school, a mobile carrier) are not counted as
 * one. It is not a name, an address or anything that identifies a person: it
 * is a random number that stays in this browser.
 */

const VISITOR_KEY = 'indiataps_visitor_id';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The number of this visitor. It is made once and then kept.
 * @returns {string}
 */
export function getVisitorId() {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // No storage (a private window): a number for this page only.
    return randomId();
  }
}

/**
 * The headers to send with a tracking request.
 * @returns {object}
 */
export function trackingHeaders() {
  return { 'x-visitor-id': getVisitorId() };
}
