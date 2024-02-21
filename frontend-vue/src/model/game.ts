export type Game = {
    deck: string[];
    playedCards: string[];
    drawPile: string[];
    maxUsers: number = 4;
    history: string[];
    startTime: Date|undefined;
    endTime: Date|undefined;
    turn: number;
}