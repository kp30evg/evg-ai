import { router } from './trpc';
import { everchatRouter } from './routers/everchat';
import { evermailRouter } from './routers/evermail';
import { unifiedRouter } from './routers/unified';
import { oauthRouter } from './routers/oauth';

export const appRouter = router({
  everchat: everchatRouter,
  evermail: evermailRouter,
  unified: unifiedRouter, // The unified API for single-table architecture
  oauth: oauthRouter, // OAuth connection management
});

export type AppRouter = typeof appRouter;