import type { User } from './user.ts';

export enum GameOption {
    MauMau,
    Uno
}

export type Room = {
    id: string;
    users: User[];
    isLocal: boolean;
    selectedGame: GameOption;
};
