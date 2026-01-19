import prisma from './prisma';

async function main() {
    console.log('Seeding database...');

    // 1. Clear existing data
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();

    // 2. Create Conversations and Messages
    const conv1 = await prisma.conversation.create({
        data: {
            messages: {
                create: [
                    { role: 'user', content: 'What is your name?' },
                    { role: 'assistant', content: 'I am your support assistant.' },
                    { role: 'user', content: 'Can you help me with an order?' },
                ]
            }
        }
    });

    const conv2 = await prisma.conversation.create({
        data: {
            messages: {
                create: [
                    { role: 'user', content: 'hello' },
                    { role: 'assistant', content: 'How can I assist you today?' },
                ]
            }
        }
    });

    // 3. Create Orders
    const order1 = await prisma.order.create({
        data: { id: 'order-123', status: 'shipped' }
    });
    const order2 = await prisma.order.create({
        data: { id: 'order-456', status: 'processing' }
    });
    const order3 = await prisma.order.create({
        data: { id: 'order-789', status: 'delivered' }
    });

    // 4. Create Payments
    await prisma.payment.create({
        data: { orderId: 'order-123', status: 'paid' }
    });
    await prisma.payment.create({
        data: { orderId: 'order-789', status: 'refunded' }
    });

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
