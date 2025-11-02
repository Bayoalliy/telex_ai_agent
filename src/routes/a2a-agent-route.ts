import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');
      const body = await c.req.json();
      const { jsonrpc, id: requestId, method, params } = body;

      // Validate JSON-RPC envelope
      if (jsonrpc !== '2.0' || !requestId) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId || null,
          error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' },
        }, 400);
      }

      // Validate agent existence
      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32602, message: `Agent '${agentId}' not found` },
        }, 404);
      }

      // Parse incoming message
      const { message } = params || {};
      let content;

      if (message?.parts && Array.isArray(message.parts)) {
        content = message.parts
          .filter(p => p.kind === 'text' && p.text)
          .map(p => ({ type: 'text', text: p.text }));
      } else if (typeof message === 'string') {
        content = [{ type: 'text', text: message }];
      } else {
        content = [{ type: 'text', text: JSON.stringify(message) }];
      }

      const mastraMessages = [
        { role: message?.role || 'user', content }
      ];

      // Call the agent
      const response = await agent.generate(mastraMessages);
      const agentText = response.text || '';

      //  Return JSON-RPC response
      return c.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          message: agentText,
          artifacts: [{ kind: 'text', text: agentText }],
          status: { state: 'completed', timestamp: new Date().toISOString() },
        },
      });
    } catch (error) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Internal Error', data: error.message },
      }, 500);
    }
  },
});
