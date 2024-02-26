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
