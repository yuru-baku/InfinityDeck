import type { Card } from './card';

export type User = {
    name: string;
    id: string;
    isOwner: boolean;
    disconnected: boolean | undefined;
    cards: Card[];
};
