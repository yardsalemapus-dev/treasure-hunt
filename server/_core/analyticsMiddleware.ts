import type { Express } from "express";

/**
 * Middleware to handle requests with unresolved analytics endpoint placeholders.
 * This prevents "Invalid URL" errors when VITE_ANALYTICS_ENDPOINT is not properly
 * substituted at build time.
 */
export function setupAnalyticsMiddleware(app: Express) {
  // Catch requests to paths with unresolved environment variable placeholders
  app.use((req, res, next) => {
    const url = req.originalUrl;
    
    // Check if the URL contains unresolved Vite environment variable placeholders
    if (url.includes("%VITE_") || url.includes("%ENV_")) {
      // Log the problematic request
      console.warn(`[Analytics Middleware] Blocked request with unresolved env var: ${url}`);
      
      // Return a 404 or 204 to prevent the error from propagating
      // Use 204 No Content for analytics/tracking requests
      if (url.includes("umami") || url.includes("analytics")) {
        return res.status(204).end();
      }
      
      // For other requests, return 404
      return res.status(404).json({ error: "Not found" });
    }
    
    next();
  });
}
