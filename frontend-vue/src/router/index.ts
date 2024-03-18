import { createRouter, createWebHashHistory } from 'vue-router';
import LandingView from '@/views/LandingView.vue';
import LobbyCreaterView from '@/views/LobbyCreaterView.vue';
import GameView from '@/views/GameView.vue';
import ArComponent from '@/components/ar-component/ArComponent.vue';
import EndGameView from '@/views/EndGameView.vue';

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'landing-page',
            component: LandingView
        },
        {
            path: '/lobby',
            name: 'Lobby',
            component: LobbyCreaterView
        },
        {
            path: '/test/ar',
            name: 'AR-Test',
            component: ArComponent
        },
        {
            path: '/game',
            name: 'Game',
            component: GameView
        },
        {
            path: '/summary',
            name: 'Summary',
            component: EndGameView
        }
    ]
});

export default router;
