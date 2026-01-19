# Multi-Agent Customer Support System

This is my R&D Internship Assignment for swades.ai. It’s a full-stack AI customer support chat that routes you to the right department (Support, Order, or Billing) and remembers your conversation history.

---

## 🏗 High-Level Architecture

I built this as a **Monorepo** (using Turborepo) to keep the backend and frontend separate but easy to manage.

1.  **Apps:**
    *   **`apps/web`**: The frontend. A React + Vite app. It’s pretty simple—just a dark-themed chat interface that talks to the API.
    *   **`apps/api`**: The backend. Built with Hono (it’s fast). This is where the brains are.
2.  **Packages:**
    *   **`packages/rpc-types`**: A shared folder so the frontend knows exactly what the backend sends (Type Safety).

### HOW IT WORKS (The "Brain")
It uses a **Controller-Service-Agent** pattern:
1.  **Controller**: Receives your message (`POST /api/chat/messages`).
2.  **Service (`AgentService`)**:
    *   Saves your message to the DB (Prisma + SQLite).
    *   **Compaction**: If the chat gets too long (>10 messages), it summarizes the old stuff so we don't crash the AI.
    *   **Router**: Asks a small AI ("RouterAgent") to decide if you need *Support*, *Order*, or *Billing*.
    *   **Agent**: Calls the right agent.
3.  **Agents**:
    *   Each agent has a specific personality and tools (e.g., the Order Agent can "look up" order #123).
    *   They generate a response using Groq (`llama-3.1-8b-instant`).

---

## 🎨 Design Decisions

*   **Hono over Express**: I chose Hono because it supports RPC (remote procedure calls). This means I didn't have to manually write TypeScript types for every API response—it just worked.
*   **SQLite**: Kept it simple. No need for a heavy Postgres server for a demo.
*   **Groq**: It’s super fast. Dealing with slow AI responses is annoying, so I picked the fastest provider I could find.
*   **"Compaction"**: LLMs have a limit on how much text they can read. Instead of just deleting old messages, I wrote logic to summarize them. It’s like giving the AI a "previously on..." recap.

---

## ⚠️ What Went Wrong (And How I Fixed It)

It wasn't smooth sailing. Here is the honest truth about the bugs I hit:

1.  **The "Infinite Loop" Router**:
    *   *Issue*: At first, the RouterAgent kept returning JSON that wasn't quite right, and my code broke trying to parse it.
    *   *Fix*: I switched to a strict `object` output mode in the Vercel AI SDK to force the model to behave.

2.  **Missing "Workspace" Protocol**:
    *   *Issue*: I tried using `npm install` with `workspace:*` dependencies (which works in pnpm/yarn), but npm yelled at me.
    *   *Fix*: I had to go into `package.json` and change the versions to just `*`. Simple fix, but annoying error.

3.  **Frontend CSS Alignment**:
    *   *Issue*: The user asked for "left-oriented text". I thought I added it, but I applied it to the wrong CSS class.
    *   *Fix*: I had to explicitly add `text-align: left` to the `.bubble` class.

4.  **Conversation Memory**:
    *   *Issue*: The AI kept saying "I don't see a previous message" even when there was one.
    *   *Fix*: I tightened up the System Prompt (the instructions I give the AI) to tell it: "ALWAYS check the history provided."

---

## 🚀 How to Run It

1.  **Install**:
    ```bash
    npm install
    ```

2.  **Example .env**:
    Make sure you have a `.env` file with `GROQ_API_KEY` and `DATABASE_URL`.

3.  **Run**:
    ```bash
    npm run dev
    ```
    This runs BOTH the backend (port 3000) and frontend (port 5173).

4.  **Test**:
    ```bash
    npm test
    ```
    Runs the unit tests I wrote for the router and database persistence.
