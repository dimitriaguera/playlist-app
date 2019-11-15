/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
const TOKEN_KEY = 'token';

/**
 * Store token on sessionStorage.
 *
 * @param token
 */
export function setLocalToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Return token from sessionStorage.
 *
 */
export function getLocalToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Remove token from sessionStorage.
 *
 */
export function clearLocalStorage() {
  sessionStorage.removeItem(TOKEN_KEY);
}
