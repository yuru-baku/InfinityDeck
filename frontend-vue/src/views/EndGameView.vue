<script setup lang="ts">
import startButton from '@/components/startButton.vue';
import { useRouter, type Router } from 'vue-router';
import { useCookies } from '@vueuse/integrations/useCookies';

const router = useRouter();
const cookies = useCookies(['roomId', 'lastGame']);

const lastGame: {
    history: string[];
    startTime: string;
    endTime: string;
    users: { name: string; id: string; handcards: string[] }[];
} = cookies.get('lastGame');
const timesShuffled = lastGame.history.filter((el) => el === 'shuffle').length;
const cardsDrawen = lastGame.history.filter((el) => el.startsWith('+')).length;
const cardsPlayed = lastGame.history.filter((el) => el.startsWith('>')).length;
const timeDiff = Math.ceil(
    (new Date(lastGame.endTime).getTime() - new Date(lastGame.startTime).getTime()) / 1000
); //in ms
console.log(lastGame, timeDiff);

const navigate = () => {
    let roomId = router.currentRoute.value.query.roomId || cookies.get('roomId');
    roomId += '2';
    router.push(`/?roomId=${roomId}`);
};
</script>

<template>
    <main class="vertical">
        <div class="frame" id="name-chooser">
            <h1>Summary</h1>
            <table>
                <tr>
                    <td>times shuffled</td>
                    <td>{{ timesShuffled }}</td>
                </tr>
                <tr>
                    <td>cards drawn</td>
                    <td>{{ cardsDrawen }}</td>
                </tr>
                <tr>
                    <td>cards played</td>
                    <td>{{ cardsPlayed }}</td>
                </tr>
                <tr>
                    <td>time played</td>
                    <td>{{ Math.floor(timeDiff / 60) }}min {{ timeDiff % 60 }}s</td>
                </tr>
            </table>
            <p>We hope you enjoyed your experience! Click start to open a new game!</p>
            <startButton @click="navigate"></startButton>
        </div>
    </main>
</template>
