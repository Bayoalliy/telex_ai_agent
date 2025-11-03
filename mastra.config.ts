import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { sunriseAgent } from './src/agents/sunrise-agent';
import { a2aAgentRoute } from './src/routes/a2a-agent-route';

export const mastra = new Mastra({
  // Register all agents
  agents: { sunriseAgent },

  // Memory & storage backend.
  storage: new LibSQLStore({ url: ':memory:' }),

  // Logging setup
  logger: new PinoLogger({
    name: 'SunriseAgent',
    level: 'debug',
  }),

  // Observability (optional telemetry)
  observability: {
    default: { enabled: true },
  },

  // API server configuration
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
    apiRoutes: [a2aAgentRoute],
  },
});
