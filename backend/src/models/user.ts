import { WebSocket } from "ws";

export class User {

    ws: WebSocket;
    id: string;
    name: string;
    isOwner: boolean;
    timeout: NodeJS.Timeout|undefined;
    markerMap: Map<string, any>;

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
        this.isOwner = false;
        this.markerMap = new Map();
    }
}