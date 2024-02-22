import { defineStore } from 'pinia';

export const useWebSocketStore = defineStore('webSocket', {
    state: () => {
        return {
            webSocket: null as unknown as WebSocket
        };
    },
    actions: {
        changeWebSocket(payload: any) {
            this.webSocket = payload;
        }
    }
});
