import { WebSocket } from "ws";

export class User {

    ws: WebSocket;
    id: string;
    name: string;
    handcards: string[];
    isOwner: boolean;
    timeout: NodeJS.Timeout|undefined;

    constructor(ws: WebSocket, id: string|undefined, name: string|undefined) {
        this.ws = ws;
        if (id) {
            this.id = id;
        } else {
            this.id = 'user_' + (Math.random() + 1).toString(36).substring(7);
        }
        if (name) {
            this.name = name;
        } else {
            this.name = 'name_' + (Math.random() + 1).toString(36).substring(7);
        }
        this.handcards = [];
        this.isOwner = false;
    }
}