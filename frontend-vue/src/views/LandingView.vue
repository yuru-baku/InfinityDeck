<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useWebSocketStore } from '../stores/webSocketStore'
  import { useCookies } from '@vueuse/integrations/useCookies'
  import startButton from '@/components/startButton.vue'

  const router = useRouter()
  const store = useWebSocketStore()
  const cookies = useCookies(['username', 'roomId', 'userId'])
  let name = ref(cookies.get('username'))

  function joinRoom() {
    let roomId = router.currentRoute.value.query.roomId || cookies.get('roomId')
    let userId = cookies.get('userId');

    cookies.set('username', name.value);
    store.changeWebSocket(new WebSocket(`${import.meta.env.VITE_BACKEND_ENDPOINT}?name=${name.value}&roomId=${roomId}&userId=${userId}`))
    const abortController = new AbortController();
    store.webSocket.addEventListener('message', (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      console.log(data)
      if (data.action === 'connected') {
        cookies.set('userId', data.data.you.id);
        cookies.set('roomId', data.data.roomId);
        // navigate to lobby
        router.push(`/lobby?roomId=${data.data.roomId}`)
        abortController.abort();
      } else {
        console.error('Could not join!')
      }
    }, { signal: abortController.signal });
  }
</script>

<template>
  <main class="vertical">
    <form class="frame" id="name-chooser">
      <label for="nickname">Choose your name</label>
      <input type="text" id="nickname" default="LustigerName420" v-model="name" />
      <!-- <button type="button" class="startButton" @click="joinRoom()">Start</button> -->
      <startButton @click="joinRoom()"></startButton>
    </form>
  </main>
</template>