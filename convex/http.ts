import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { auth } from './auth'

const http = httpRouter()

// Debug endpoint to check env vars - remove after debugging
http.route({
  path: "/debug/env",
  method: "GET",
  handler: httpAction(async () => {
    const envVars = {
      CUSTOM_AUTH_SITE_URL: process.env.CUSTOM_AUTH_SITE_URL ?? "NOT SET",
      CONVEX_SITE_URL: process.env.CONVEX_SITE_URL ?? "NOT SET",
      CONVEX_SITE_ORIGIN: process.env.CONVEX_SITE_ORIGIN ?? "NOT SET",
      CONVEX_CLOUD_ORIGIN: process.env.CONVEX_CLOUD_ORIGIN ?? "NOT SET",
      CONVEX_CLOUD_URL: process.env.CONVEX_CLOUD_URL ?? "NOT SET",
      SITE_URL: process.env.SITE_URL ?? "NOT SET",
    };
    console.log("DEBUG ENV VARS:", JSON.stringify(envVars, null, 2));
    return new Response(JSON.stringify(envVars, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

auth.addHttpRoutes(http)

export default http
