import { WebSocket } from "ws";

export class User {

    ws: WebSocket;
    id: string;
    name: string;
    handcards: string[];
    isLocal: boolean;
    isAdmin: boolean;

    constructor(ws: WebSocket, id: string, name: string, isLocal: boolean = false) {
        this.ws = ws;
        this.id = id;
        this.name = name;
        this.handcards = [];
        this.isLocal = isLocal;
        this.isAdmin = false;
    }
}