import type { User } from './user';

// note these types exist both in the back and frontend
// if performance issues arrise due to synchronisation we can simplify these types in transport
// this would however would rise the calculcation needs on both ends.

/**
 * Enum discripbing position of card on the table
 * position may influence rendering
 */
export enum Zone {
    shared = 'shared',
    private = 'private'
}

/**
 * Type discribing a card on the table
 * the markerId is the number encoded in the AR-Code
 * the cardFace is the face that should be rendered over the AR-Code
 * the zone encoding the position on the table
 */
export type Card = {
    url: string | undefined;
    cardFace: string;
    zone: Zone | undefined;
    found: boolean;
    lastSeen: number;
};

/**
 * list of cards currently hold by a specific player
 * used as response to the getCards call from the backend
 */
export type UserCards = { userId: string; cards: Card[] };

/**
 * list of all cards currrently known to the session as
 * regulary provided by the backend
 */
export type AllCards = {
    sharedCard: Card | undefined;
    userCards: UserCards[];
};
