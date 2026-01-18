import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Cleanup existing data
    await prisma.invoice.deleteMany().catch(() => { });
    await prisma.payment.deleteMany().catch(() => { });
    await prisma.orderItem.deleteMany().catch(() => { });
    await prisma.order.deleteMany().catch(() => { });
    await prisma.message.deleteMany().catch(() => { });
    await prisma.conversation.deleteMany().catch(() => { });
    await prisma.user.deleteMany().catch(() => { });

    // Create a Demo User
    const user = await prisma.user.create({
        data: {
            email: 'demo@example.com',
            name: 'Alice Smith',
        },
    });

    console.log(`👤 Created user: ${user.name}`);

    // Create an Order (Shipped)
    const order1 = await prisma.order.create({
        data: {
            id: 'order-123',
            userId: user.id,
            status: 'shipped',
            total: 120.50,
            items: {
                create: [
                    { product: 'Wireless Headphones', quantity: 1, price: 99.00 },
                    { product: 'USB-C Cable', quantity: 2, price: 10.75 },
                ],
            },
        },
    });

    // ... (Invoice/Payment creation remains same using order1.id)
    
    // ...

    // Create a pending order
    const order2 = await prisma.order.create({
        data: {
            id: 'order-456',
            userId: user.id,
            status: 'pending',
            total: 45.00,
            items: {
                create: [
                    { product: 'Desk Pad', quantity: 1, price: 45.00 },
                ],
            },
        },
    });

    console.log(`📦 Created Order 2: ${order2.id} (Pending)`);

    // Create a delayed order
    const order3 = await prisma.order.create({
        data: {
            id: 'order-789',
            userId: user.id,
            status: 'delayed', // Custom status for testing
            total: 299.99,
            items: {
                create: [
                    { product: 'Gaming Monitor', quantity: 1, price: 299.99 },
                ],
            },
        },
    });
    console.log(`📦 Created Order 3: ${order3.id} (Delayed)`);

    // Create a delivered order with valid refund pending
    const order4 = await prisma.order.create({
        data: {
            id: 'order-refund',
            userId: user.id,
            status: 'delivered',
            total: 50.00,
            items: { create: [{ product: 'Defective Mouse', quantity: 1, price: 50.00 }] },
            payment: {
                create: {
                    amount: 50.00,
                    status: 'refunded', // Payment marked as refunded
                    transactionId: 'tx_ref123'
                }
            },
            invoice: {
                create: {
                    amount: 50.00,
                    status: 'refunded',
                    url: 'https://invoices.example.com/inv_refund.pdf'
                }
            }
        },
    });
    console.log(`📦 Created Order 4: ${order4.id} (Refunding)`);

    console.log('✅ Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
