import { prisma } from '@repo/database'
import { tool } from 'ai'
import { z } from 'zod'

import { WorkflowService } from '../services/workflow.service'

const workflowService = new WorkflowService()

// --- Mock / Real DB Tools ---

export const orderTools: any = {
    getOrder: tool({
        description: 'Get details of an order by ID',
        parameters: z.object({ orderId: z.string() }),
        execute: async ({ orderId }: { orderId: string }) => {
            console.log(`[Tool:getOrder] Querying DB for order: ${orderId}`)
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true, payment: true, invoice: true }
            })
            console.log(`[Tool:getOrder] DB returned ${order ? 'data' : 'nothing'}`)
            if (!order) return 'Order not found.'
            return JSON.stringify(order)
        }
    } as any),
    modifyOrder: tool({
        description: 'Modify an order (e.g. change address, cancel)',
        parameters: z.object({ orderId: z.string(), action: z.enum(['cancel', 'change_address']) }),
        execute: async ({ orderId, action }: { orderId: string, action: string }) => {
            console.log(`[Tool:modifyOrder] Triggering action: ${action} for ${orderId}`)
            const result = await workflowService.triggerOrderModification(orderId, action)
            return JSON.stringify(result)
        }
    } as any)
}

export const billingTools: any = {
    getInvoice: tool({
        description: 'Get invoice details',
        parameters: z.object({ orderId: z.string() }),
        execute: async ({ orderId }: { orderId: string }) => {
            console.log(`[Tool:getInvoice] Querying invoice for: ${orderId}`)
            const invoice = await prisma.invoice.findUnique({ where: { orderId } })
            if (!invoice) return 'Invoice not found.'
            return JSON.stringify(invoice)
        }
    } as any),
    checkRefund: tool({
        description: 'Check refund status',
        parameters: z.object({ orderId: z.string() }),
        execute: async ({ orderId }: { orderId: string }) => {
            console.log(`[Tool:checkRefund] Querying payment for: ${orderId}`)
            const payment = await prisma.payment.findUnique({ where: { orderId } })
            if (!payment) return 'Payment record not found.'
            return `Payment Status: ${payment.status}`
        }
    } as any)
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
  - IMPORTANT: After receiving the tool data, you MUST provide a friendly, descriptive summary of the result to the user. Do not return empty text.`,

    BILLING: `You are a Billing Agent. You handle payments and invoices.
  - MANDATORY: If the user provides an order ID, use getInvoice or checkRefund tools to get data.
  - IMPORTANT: After receiving the billing/invoice data, you MUST provide a clear and helpful summary to the user. Do not return empty text.`
}
