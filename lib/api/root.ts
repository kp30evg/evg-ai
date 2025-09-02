import { router } from './trpc';
import { entityRouter } from './routers/entity';
import { commandRouter } from './routers/command';
import { moduleRouter } from './routers/module';
import { everchatRouter } from './routers/everchat';
import { evermailRouter } from './routers/evermail';

export const appRouter = router({
  entity: entityRouter,
  command: commandRouter,
  module: moduleRouter,
  everchat: everchatRouter,
  evermail: evermailRouter,
});

export type AppRouter = typeof appRouter;