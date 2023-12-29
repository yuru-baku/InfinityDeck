import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '@/views/LandingView.vue';
import LobbyCreaterView from '@/views/LobbyCreaterView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: LandingView,
    }, {
      path: '/lobby',
      name: 'Lobby',
      component: LobbyCreaterView,
    }
  ]
})

export default router
