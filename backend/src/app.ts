import { MongoClient } from 'mongodb';
import { WebSocket, WebSocketServer } from 'ws';
import { Room } from './models/room.js';
import { User } from './models/user.js';

const client = new MongoClient('mongodb://127.0.0.1:27017');
const dbName = 'InfinityDeck';

async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to database...');
    const db = client.db(dbName);

    const rooms = new Map();
    const wss = new WebSocketServer({ port: 8080 });
    wss.on('connection', function connection(ws: WebSocket, req) {
        // on connection create new room or join an open room
        const room_id = req.url?.match(/(?<=roomId=)\w*/)?.at(0);
        const name = req.url?.match(/(?<=name=)\w*/)?.at(0);
        let room: Room;
        console.log(room_id, name)
        if (room_id && room_id !== '' && room_id !== 'undefined') { // get open room
            room = rooms.get(room_id);
            if (!room) {
                ws.send(JSON.stringify({ error: `Room with id ${room_id} could not be found...`}));
                ws.close();
                return;
            }
            console.log('User joined', room.id);
        } else { // create new room
            room = new Room(db);
            while (rooms.get(room.id)) {
                console.log('Room was already taken!');
                room = new Room(db);
            }
            rooms.set(room.id, room);
            console.log('User created', room.id);
        }
        // find user and join
        let user = new User(ws, undefined, name);
        room.join(user);
        ws.send(JSON.stringify({ action: 'connected', data: { roomId: room.id, users: room.users.map(user => { return { name: user.name, isOwner: user.isAdmin, id: user.id }}) }}));

        ws.on('error', console.error);
        ws.on('close', data => {
            let userCount = room.leave(user); // is he actually leaving?
            if (userCount <= 0) {
                rooms.delete(room.id);
            }
        });
    });

    return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());