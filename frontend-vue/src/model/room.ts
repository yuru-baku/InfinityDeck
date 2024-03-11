import type { User } from './user.ts';
import { GAME_CONFIG } from './game.js';

export type Room = {
    id: string;
    users: User[];
    isLocal: boolean;
    selectedGame: keyof typeof GAME_CONFIG;
    state: 'inLobby' | 'inGame' | 'finished';
};
