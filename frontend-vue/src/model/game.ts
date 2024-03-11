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


export const GAME_CONFIG: {[game: string]: { label: string, basePath: string, cardBack: string, id: string }} = {
    Uno: {
        label: 'Uno',
        id: 'Uno',
        basePath: '/InfintyDeck/cardImages/uno-cards',
        cardBack: '/InfintyDeck/cardImages/uno-cards/wish.svg',
    },
    MauMau: {
        label: 'french',
        id: 'MauMau',
        basePath: '/InfintyDeck/cardImages/french-suited-cards',
        cardBack: '/InfintyDeck/cardImages/french-suited-cards/card-back-blue.svg',
    }
}