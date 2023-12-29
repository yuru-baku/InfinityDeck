import {defineStore} from 'pinia';

export const useWebSocketStore = defineStore('webSocket', {
    state: () => {
        return {
            webSocket: null
        }
    }, 
    actions:{
        changeWebSocket(payload) {
            this.webSocket = payload;
        }
    }
})