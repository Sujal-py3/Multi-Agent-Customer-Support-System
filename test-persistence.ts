import fs from "fs";
import prisma from "./apps/api/src/db/prisma";
import { agentService } from "./apps/api/src/services/agent.service";

async function runTests() {
    let log = "--- Starting Sanity Tests ---\n";

    try {
        // 1. New Conversation
        log += "\n[Test 1] New conversation: 'hello'\n";
        const res1 = await agentService.handleMessage("hello");
        log += `Response: ${res1.text}\n`;
        log += `Agent: ${res1.agentName}\n`;
        const conversationId = res1.conversationId;

        // 2. Follow-up
        log += "\n[Test 2] Follow-up: 'what did I ask before?'\n";
        const res2 = await agentService.handleMessage("what did I ask before?", [], conversationId);
        log += `Response: ${res2.text}\n`;
        log += `Agent: ${res2.agentName}\n`;

        // 3. Order
        log += "\n[Test 3] Order: 'where is my order order-123'\n";
        const res3 = await agentService.handleMessage("where is my order order-123", [], conversationId);
        log += `Response: ${res3.text}\n`;
        log += `Agent: ${res3.agentName}\n`;

        // 4. Billing
        log += "\n[Test 4] Billing: 'is my payment for order-123 refunded?'\n";
        const res4 = await agentService.handleMessage("is my payment for order-123 refunded?", [], conversationId);
        log += `Response: ${res4.text}\n`;
        log += `Agent: ${res4.agentName}\n`;

        log += "\n--- Verification Complete ---\n";

        const count = await prisma.message.count({ where: { conversationId } });
        log += `Total messages persisted: ${count}\n`;

    } catch (error: any) {
        log += `Test failed: ${error.message}\n`;
    } finally {
        fs.writeFileSync("test_log.txt", log);
        await prisma.$disconnect();
        process.exit(0);
    }
}

runTests();
