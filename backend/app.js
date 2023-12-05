import { MongoClient } from 'mongodb';
import { WebSocketServer } from 'ws';
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
    wss.on('connection', function connection(ws, req) {
        // on connection create new room or join an open room
        const room_id = req.url.match(/(?<=room=)\w*/);
        let room;
        if (room_id) { // get open room
            room = rooms.get(room_id);
            if (!room) {
                ws.send('error');
                ws.close();
            }
            console.log('User joined', room_id);
        } else { // create new room
            room = new Room();
            while (rooms.get(room.id)) {
                console.log('Room was already taken!');
                room = new Room();
            }
            rooms.set(room.id, room);
            console.log('User created', room_id);
        }
        // find user and join
        let user = new User(ws, '', 'Random')
        room.join(user);
        ws.send(room.id);

        ws.on('error', console.error);
        ws.on('close', data => {
            let userCount = room.leave(data, user);
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