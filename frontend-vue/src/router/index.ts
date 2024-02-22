import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '@/views/LandingView.vue';
import LobbyCreaterView from '@/views/LobbyCreaterView.vue';
import GameView from '@/views/GameView.vue';
import ArComponent from '@/components/ar-component/ArComponent.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
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
            path: '/maumau',
            name: 'MauMau',
            component: GameView
        }
    ]
});

export default router;
