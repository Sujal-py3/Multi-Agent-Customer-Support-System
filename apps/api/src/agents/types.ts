export interface IAgent {
    handle(query: string, history: any[], conversationId?: string): Promise<string>;
}
