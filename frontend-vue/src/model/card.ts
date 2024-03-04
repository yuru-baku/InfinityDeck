import type { User } from '@/model/user.ts';

export enum Zone {
    shared,
    private
}

export type Card = {
    markerId: string;
    cardFace: string;
    owner: User;
    zone: Zone;
};
