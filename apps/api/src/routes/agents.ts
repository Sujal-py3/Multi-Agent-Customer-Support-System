import { agentController } from '../controllers/agent.controller';
import { Hono } from 'hono'

const agents = new Hono();

agents.get('/', agentController.listAgents);
agents.get('/:type/capabilities', agentController.getCapabilities);

export default agents;
