import prisma from '../db/prisma';

export const billingTool = {
    async getInvoiceByOrderId(orderId: string) {
        console.log(`[Tool] getInvoiceByOrderId: ${orderId} from DB`);

        const payment = await prisma.payment.findFirst({
            where: { orderId }
        });

        if (!payment) {
            throw new Error(`No payment found for order ${orderId}`);
        }

        return {
            invoiceId: payment.id,
            status: payment.status // Should be 'paid' or other status from DB
        };
    },

    async getRefundStatus(orderId: string) {
        console.log(`[Tool] getRefundStatus: ${orderId} (Prisma linked)`);
        const payment = await prisma.payment.findFirst({ where: { orderId } });
        return {
            status: payment?.status === 'refunded' ? 'refunded' : 'none'
        };
    }
};
