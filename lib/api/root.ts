import { router } from './trpc';
import { everchatRouter } from './routers/everchat';
import { evermailRouter } from './routers/evermail';
import { unifiedRouter } from './routers/unified';

export const appRouter = router({
  everchat: everchatRouter,
  evermail: evermailRouter,
  unified: unifiedRouter, // The unified API for single-table architecture
});

export type AppRouter = typeof appRouter;