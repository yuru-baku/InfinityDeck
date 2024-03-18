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
let client = new MongoClient(process.env.MONGO_URI);
const dbName = 'InfinityDeck';

async function main() {
    // Use connect method to connect to the server
    console.log('> Connecting to database');
    client = await client.connect();
    const db = client.db(dbName);
    console.log(' > Successfully connected to database');
    //const db = undefined;

    const rooms = new Map();
    const wss = new WebSocketServer({ port: Number(process.env.PORT) });
    wss.on('connection', function connection(ws: WebSocket, req) {
        // on connection create new room or join an open room
        const decodedURL = req.url ? decodeURI(req.url) : '';
        const room_id = decodedURL.match(/(?<=roomId=)[\p{Number}\p{Letter}_]*/u)?.at(0);
        const name = decodedURL.match(/(?<=name=)[\p{Number}\p{Letter}_]*/u)?.at(0);
        const user_id = decodedURL.match(/(?<=userId=)[\p{Number}\p{Letter}_]*/u)?.at(0);
        let room: Room | undefined = rooms.get(room_id);

        // if (room_id && room_id !== '' && room_id !== 'undefined') { // get open room
        //     room = rooms.get(room_id);
        //     if (!room) {
        //         ws.send(JSON.stringify({ error: `Room with id ${room_id} could not be found...`}));
        //         ws.close();
        //         return;
        //     }
        //     console.log('User joined', room.id);
        if (!room) {
            // create new room
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
        const _user = room.users.find(
            (user) => user.id === user_id && user.name === name && user.timeout
        );
        if (_user) {
            user = _user;
            user.ws = ws;
            room.reconnect(user);
        } else {
            if (!room.isJoinable()) {
                ws.send(
                    JSON.stringify({
                        action: 'error',
                        data: {
                            message: 'The Room is already full or in a running game!'
                        }
                    })
                );
                return;
            }
            user = new User(ws, undefined, name);
            room.join(user);
        }
        room.sendRoomInfo(user, 'connected');

        ws.on('error', console.error);
        ws.on('close', (data) => {
            room!.leave(user).then(userCount => {
                if (userCount <= 0) {
                    rooms.delete(room!.id);
                }
            })
        });
    });

    return ` > Started with port ${process.env.PORT}`;
}

main().then(console.log).catch(console.error);
// .finally(() => client.close());
