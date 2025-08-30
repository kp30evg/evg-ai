import { router } from './trpc';
import { entityRouter } from './routers/entity';
import { commandRouter } from './routers/command';
import { moduleRouter } from './routers/module';

export const appRouter = router({
  entity: entityRouter,
  command: commandRouter,
  module: moduleRouter,
});

export type AppRouter = typeof appRouter;