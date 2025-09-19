import { router } from './trpc';
import { everchatRouter } from './routers/everchat';
import { evermailRouter } from './routers/evermail';
import { evertaskRouter } from './routers/evertask';
import { unifiedRouter } from './routers/unified';
import { oauthRouter } from './routers/oauth';
import { workspaceConfigRouter } from './routers/workspace-config';
import { entityTypesRouter } from './routers/entity-types';
import { organizationRouter } from './routers/organization';

export const appRouter = router({
  everchat: everchatRouter,
  evermail: evermailRouter,
  evertask: evertaskRouter,
  unified: unifiedRouter, // The unified API for single-table architecture
  oauth: oauthRouter, // OAuth connection management
  workspaceConfig: workspaceConfigRouter, // Workspace configuration management
  entityTypes: entityTypesRouter, // Dynamic entity types management
  organization: organizationRouter, // Organization and team management
});

export type AppRouter = typeof appRouter;