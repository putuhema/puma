const sessionKey = "puma:sanctuary:session";

/**
 * This browser's seat on the station: a random id, kept in localStorage,
 * that rate limits and "that's you" highlights hang off. Browser only.
 */
export function stationSession() {
  let sessionId = window.localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem(sessionKey, sessionId);
  }
  return sessionId;
}
