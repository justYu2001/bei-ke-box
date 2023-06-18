import { createTRPCRouter } from "@/server/api/trpc";
import { accountsRouter } from "@/server/api/routers/accounts";
import { noteRouter } from "@/server/api/routers/note";
import { yearRouter } from "@/server/api/routers/year";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    accounts: accountsRouter,
    notes: noteRouter,
    years: yearRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
