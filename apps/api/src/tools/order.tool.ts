import prisma from '../db/prisma';

export const orderTool = {
    async getOrderById(orderId: string) {
        console.log(`[Tool] getOrderById: ${orderId} from DB`);

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        return {
            status: order.status,
            deliveryText: `Your order is currently ${order.status}.`
        };
    },

    async getDeliveryStatus(orderId: string) {
        console.log(`[Tool] getDeliveryStatus: ${orderId} (Prisma linked)`);
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        return {
            status: order?.status || 'unknown',
            deliveryText: order ? `Your order status is ${order.status}.` : 'Order not found.'
        };
    }
};
