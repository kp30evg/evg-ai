import { router } from './trpc';
import { entityRouter } from './routers/entity';
import { commandRouter } from './routers/command';
import { moduleRouter } from './routers/module';
import { everchatRouter } from './routers/everchat';

export const appRouter = router({
  entity: entityRouter,
  command: commandRouter,
  module: moduleRouter,
  everchat: everchatRouter,
});

export type AppRouter = typeof appRouter;