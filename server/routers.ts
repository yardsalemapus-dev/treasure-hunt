import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { listingsRouter } from "./routers/listings";
import { routesRouter } from "./routers/routes";
import { stripeRouter } from "./routers/stripe";
import { reviewsRouter } from "./routers/reviews";
import { notificationsRouter } from "./routers/notifications";
import { searchRouter } from "./routers/search";
import { analyticsRouter } from "./routers/analytics";
import { emailRouter } from "./routers/email";
import { sellerRouter } from "./routers/seller";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  listings: listingsRouter,
  routes: routesRouter,
  stripe: stripeRouter,
  reviews: reviewsRouter,
  notifications: notificationsRouter,
  search: searchRouter,
  analytics: analyticsRouter,
  email: emailRouter,
  seller: sellerRouter,
});

export type AppRouter = typeof appRouter;
