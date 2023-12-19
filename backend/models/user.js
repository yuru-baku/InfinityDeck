export class User {
    constructor(ws, id, name, isLocal, isAdmin) {
        this.ws = ws;
        this.id = id;
        this.name = name;
        this.handcards = [];
        this.isLocal = isLocal || true;
        this.isAdmin = isAdmin || false;
    }
}