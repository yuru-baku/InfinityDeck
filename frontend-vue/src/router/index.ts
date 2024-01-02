import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '@/views/LandingView.vue';
import LobbyCreaterView from '@/views/LobbyCreaterView.vue';
import ArComponent from '@/components/ar-component/ArComponent.vue';

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
    }, {
      path: '/test',
      name: 'AR-Test',
      component: ArComponent,
    }
  ]
})

export default router
