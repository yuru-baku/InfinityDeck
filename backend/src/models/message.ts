import WebSocket from 'ws';

export class Message {
    action: string;
    data: any;

    constructor(event: MessageEvent) {
        const parsed = JSON.parse(event.data.toString());
        this.action = parsed.action;
        this.data = parsed.data;
    }
}
