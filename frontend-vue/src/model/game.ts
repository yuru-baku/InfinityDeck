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
        basePath: '/infinityDeck/cardImages/uno-cards',
        cardBack: '/infinityDeck/cardImages/uno-cards/back.svg'
    },
    MauMau: {
        label: 'french',
        id: 'MauMau',
        basePath: '/infinityDeck/cardImages/french-suited-cards',
        cardBack: '/infinityDeck/cardImages/french-suited-cards/card-back-blue.svg'
    }
};
