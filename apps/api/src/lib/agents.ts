import { prisma } from '@repo/database'
import { tool } from 'ai'
import { z } from 'zod'

import { WorkflowService } from '../services/workflow.service'

const workflowService = new WorkflowService()

// --- Mock / Real DB Tools ---

export const orderTools = {
    getOrder: tool({
        description: 'Get details of an order by ID',
        parameters: z.object({ orderId: z.string() }),
        execute: async ({ orderId }) => {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true, payment: true, invoice: true }
            })
            if (!order) return 'Order not found.'
            return JSON.stringify(order)
        }
    }),
    modifyOrder: tool({
        description: 'Modify an order (e.g. change address, cancel)',
        parameters: z.object({ orderId: z.string(), action: z.enum(['cancel', 'change_address']) }),
        execute: async ({ orderId, action }) => {
            const result = await workflowService.triggerOrderModification(orderId, action)
            return JSON.stringify(result)
        }
    })
}

export const billingTools = {
    getInvoice: tool({
        description: 'Get invoice details',
        parameters: z.object({ orderId: z.string() }),
        execute: async ({ orderId }) => {
            const invoice = await prisma.invoice.findUnique({ where: { orderId } })
            if (!invoice) return 'Invoice not found.'
            return JSON.stringify(invoice)
        }
    }),
    checkRefund: tool({
        description: 'Check refund status',
        parameters: z.object({ orderId: z.string() }),
        execute: async ({ orderId }) => {
            const payment = await prisma.payment.findUnique({ where: { orderId } })
            if (!payment) return 'Payment record not found.'
            return `Payment Status: ${payment.status}`
        }
    })
}

// --- System Prompts ---

export const AGENT_PROMPTS = {
    ROUTER: `You are a Router Agent. Analyze the user's query and decide which specialized agent should handle it.
  - "support": General questions, FAQs, troubleshooting.
  - "order": Order status, shipping, cancellation, modifications.
  - "billing": Invoices, payments, refunds.
  Reply ONLY with the agent name in lowercase: "support", "order", or "billing".`,

    SUPPORT: `You are a friendly Support Agent. Answer general questions and help users troubleshoot.
  Use the conversation history to understand context.
  If you don't know, say so. Be polite and professional.`,

    ORDER: `You are an Order Management Agent. You have access to order tools.
  - MANDATORY: If the user provides an order ID, you MUST use the getOrder tool to check its status. 
  - Do NOT guess order details.
  - If a user wants to modify an order, use the modifyOrder tool.
  - Be specific about what items are in the order based on the tool result.`,

    BILLING: `You are a Billing Agent. You handle payments and invoices.
  - MANDATORY: If the user provides an order ID, use getInvoice or checkRefund tools to get data.
  - Be precise with financial details and transaction IDs provided by tools.`
}
