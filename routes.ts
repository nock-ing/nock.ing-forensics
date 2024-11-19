/**
 * An array of routes that are accessible to the public
 * These routes do not require auth
 * @type {string[]}
 */
export const publicRoutes = [
    "/"
];

/**
 * An array of routes that are used for auth
 * These routes will redirect logged-in users to protected pages
 * @type {string[]}
 */
export const authRoutes = [
    "/auth/login",
    "/auth/register",
];
/**
 * Prefix for API documentation routes
 * Routes that start with this prefix are used for API auth purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/rpc-info";