import { Context } from 'hono'

export class AgentController {
    listAgents = async (c: Context) => {
        return c.json([
            { id: 'support', name: 'Support Agent', description: 'General FAQs and troubleshooting' },
            { id: 'order', name: 'Order Agent', description: 'Order status and modifications' },
            { id: 'billing', name: 'Billing Agent', description: 'Invoices and refunds' }
        ])
    }

    getAgentCapabilities = async (c: Context) => {
        const type = c.req.param('type')
        const capabilities: Record<string, string[]> = {
            support: ['Query History', 'General FAQ'],
            order: ['Get Order', 'Modify Order', 'Cancel Order'],
            billing: ['Get Invoice', 'Check Refund Status']
        }
        return c.json({ type, capabilities: capabilities[type] || [] })
    }
}
