export type Game = {
    deck: string[];
    playedCards: string[];
    drawPile: string[];
    maxUsers: number;
    history: string[];
    startTime: Date | undefined;
    endTime: Date | undefined;
    turn: number;
};

export const GAME_CONFIG: {
    [game: string]: { label: string; basePath: string; cardBack: string; id: string };
} = {
    Uno: {
        label: 'Uno',
        id: 'Uno',
        basePath: '/InfinityDeck/cardImages/uno-cards',
        cardBack: 'back'
    },
    MauMau: {
        label: 'french',
        id: 'MauMau',
        basePath: '/InfinityDeck/cardImages/french-suited-cards',
        cardBack: 'card-back-blue'
    }
};
