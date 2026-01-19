import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Conversations
    const convo1 = await prisma.conversation.create({
        data: {}
    });

    const convo2 = await prisma.conversation.create({
        data: {}
    });

    // Messages
    await prisma.message.createMany({
        data: [
            {
                conversationId: convo1.id,
                role: "user",
                content: "Hello"
            },
            {
                conversationId: convo1.id,
                role: "assistant",
                content: "Hi, how can I help?"
            },
            {
                conversationId: convo1.id,
                role: "user",
                content: "What did I ask before?"
            },
            {
                conversationId: convo2.id,
                role: "user",
                content: "Where is my order?"
            }
        ]
    });

    // Orders
    await prisma.order.createMany({
        data: [
            { id: "order-123", status: "shipped" },
            { id: "order-456", status: "processing" },
            { id: "order-789", status: "delivered" }
        ]
    });

    // Payments
    await prisma.payment.createMany({
        data: [
            { id: "pay-1", orderId: "order-123", status: "paid" },
            { id: "pay-2", orderId: "order-456", status: "refunded" }
        ]
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
