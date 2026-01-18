# AI-Powered Multi-Agent Customer Support System

This project is a multi-agent customer support system built as part of an engineering internship assessment. The primary goal was to implement a clean, maintainable architecture that uses specialized AI agents to handle different customer needs (Support, Orders, Billing).

## Architecture

I followed a strict **Controller-Service-Agent** pattern to ensure clear separation of concerns:

1.  **Controller Layer**: Handles HTTP requests and responses. It doesn't know anything about AI or agents.
2.  **Service Layer**: Acts as an orchestrator. It manages conversation state (Prisma) and delegates the actual AI reasoning to the appropriate agent.
3.  **Agent Layer**: Contains the "brains" of the system. Each agent is an explicit class with a single responsibility.

## Agent System

The system consists of four explicit agents:

*   **RouterAgent**: The entry point for every user query. It classifies the intent into "support", "order", or "billing". I added a default fallback to the SupportAgent to ensure the system never hangs.
*   **SupportAgent**: Handles general queries and troubleshootings.
*   **OrderAgent**: Has access to `getOrder` and `modifyOrder` tools. It queries the mock database to provide real status updates.
*   **BillingAgent**: Handles payment and invoice queries using specialized billing tools.

## Routing Logic

The routing is handled by a dedicated `RouterAgent`. It uses a fast LLM (llama-3.1-8b) to classify the user's intent based on the query and the last few messages of context. 

**Decision Flow:**
1.  Receive Query.
2.  Router classifies intent.
3.  If intent is clear (Order/Billing), hand off to the specialist.
4.  If intent is vague or an error occurs, the SupportAgent takes over.

## Technical Decisions & Tradeoffs

*   **Stability over Streaming**: I moved from streaming to standard JSON responses. During testing, I found that streaming was prone to connection resets in some environments. Standard JSON is more stable and easier to debug for this assessment.
*   **Explicit Context**: Instead of complex token compaction, I pass the last few messages as explicit context to the Router to keep classifications accurate.
*   **Mock Database**: I seeded the database with predictable IDs like `order-123` to make manual testing and verification easy for the senior engineer.

## How to Run Locally

1.  **Setup**: `npm install`
2.  **Environment**: Create `.env` files with `GROQ_API_KEY` and `DATABASE_URL`.
3.  **Docker**: Start the database container:
    ```bash
    docker-compose up -d
    ```
4.  **Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    npx prisma db seed
    ```
5.  **Launch**: `npm run dev`

---
*Intern Note: I focused on making the agents explicit and the routing explainable, as these were the core requirements. I've left monorepo architecture and streaming as future optimizations.*
