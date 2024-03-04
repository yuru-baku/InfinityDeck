import { Db, MongoClient } from 'mongodb';
import { WebSocket, WebSocketServer } from 'ws';
import { Room } from './models/room.js';
import { User } from './models/user.js';

if (!process.env.MONGO_URI) {
    throw new Error('No MONGO_URI was defined!');
}
if (!process.env.PORT) {
    throw new Error('No MONGO_URI was defined!');
}
const client = new MongoClient(process.env.MONGO_URI);
const dbName = 'InfinityDeck';

async function main() {
    // Use connect method to connect to the server
    // await client.connect();
    // console.log('Connected successfully to database...');
    // const db = client.db(dbName);
    const db = undefined;

    const rooms = new Map();
    const wss = new WebSocketServer({ port: Number(process.env.PORT) });
    wss.on('connection', function connection(ws: WebSocket, req) {
        // on connection create new room or join an open room
        const room_id = req.url?.match(/(?<=roomId=)\w*/)?.at(0);
        const name = req.url?.match(/(?<=name=)\w*/)?.at(0);
        const user_id = req.url?.match(/(?<=userId=)\w*/)?.at(0);
        let room: Room|undefined = rooms.get(room_id);

        // if (room_id && room_id !== '' && room_id !== 'undefined') { // get open room
        //     room = rooms.get(room_id);
        //     if (!room) {
        //         ws.send(JSON.stringify({ error: `Room with id ${room_id} could not be found...`}));
        //         ws.close();
        //         return;
        //     }
        //     console.log('User joined', room.id);
        if (!room) { // create new room
            room = new Room(db, room_id);
            while (rooms.get(room.id)) {
                console.log('Room was already taken!');
                room = new Room(db);
            }
            rooms.set(room.id, room);
            console.log('User created', room.id);
        }
        // find user and join
        let user: User;
        // check if user tries to reconnect
        const _user = room.users.find((user) => user.id === user_id && user.name === name && user.timeout);
        if (_user) {
            user = _user;
            user.ws = ws;
            room.reconnect(user);
        } else {
            if (!room.isJoinable()) {
                ws.send(JSON.stringify({
                    action: 'error',
                    data: {
                        message: 'The Room is already full or in a running game!'
                    }
                }));
                return;
            }
            user = new User(ws, undefined, name);
            room.join(user);
        }
        ws.send(JSON.stringify({
            action: 'connected',
            data: {
                roomId: room.id,
                users: room.getUserInformations(),
                you: {
                    name: name,
                    id: user.id,
                    isOwner: user.isOwner
                },
                state: room.state,
                selectedGame: room.selectedGame
            }
        }));

        ws.on('error', console.error);
        ws.on('close', data => {
            let userCount = room!.leave(user); // is he actually leaving?
            // if (userCount <= 0) {
                // rooms.delete(room.id);
            // }
        });
    });

    return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());