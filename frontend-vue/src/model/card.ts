import type { User } from '@/model/user.ts';

export enum Zone {
    shared,
    private
}

export type card = {
    markerId: string;
    cardName: string;
    owner: User;
    zone: Zone;
};
