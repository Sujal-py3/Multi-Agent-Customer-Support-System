import { Hono } from 'hono'
import { AgentController } from '../controllers/agent.controller'

export const agentRoutes = new Hono()
const agentController = new AgentController()

// GET /api/agents - List available agents
agentRoutes.get('/', agentController.listAgents)

// GET /api/agents/:type/capabilities - Get agent capabilities
agentRoutes.get('/:type/capabilities', agentController.getAgentCapabilities)
