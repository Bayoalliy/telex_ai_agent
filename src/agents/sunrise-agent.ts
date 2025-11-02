import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { sunriseTool } from '../tools/sunrise-tools';

export const sunriseAgent = new Agent({
  name: 'Sunrise & Moon Agent',
  instructions: `
    You are a helpful AI assistant that provides daily sunrise, sunset, and moon information for any location.
    - If the user doesn’t specify a city, ask for one.
    - Use the sunriseTool to fetch data.
    - Include sunrise, sunset, day length, and moon phase (with moonrise/moonset if available).
    - Keep responses warm, clear, and readable. Example:
      "In Nairobi today, sunrise is at 6:23 AM and sunset at 6:45 PM. 
      Day length is 12 hours 22 minutes. The moon phase is Waxing Crescent, 
      rising at 9:14 AM and setting at 9:18 PM."
  `,
  model: 'google/gemini-2.0-flash',
  tools: { sunriseTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});
