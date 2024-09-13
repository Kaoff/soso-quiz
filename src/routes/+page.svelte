<script lang="ts">
	import { browser } from '$app/environment';
	import { shuffle } from 'lodash-es';
	import { onDestroy, onMount } from 'svelte';

	let timeLeft = $state(30_000);
	let maxTime = 30_000;
    let requestTimeInSec = 5;
    let canRequest = $state(true);
	let frame: number;
	let lastTime: DOMHighResTimeStamp;
	let timeString = $state('30s');
	let timerStopped = $state(true);
    let players: { name: string; score: number }[] = $state([]);

    let question = $state('Question');
    let difficulty = $state('easy');
    let answers = $state([{ text: '' }, { text: '', correct: true }, { text: '' }, { text: '' }]);
    let selectedCategory = $state(0);
    let timer: number;

    let { data } = $props();

    onMount(() => {
        if (browser) {
            players = localStorage.getItem('players') ? JSON.parse(localStorage.getItem('players') || '') : []
        }

        timer = setInterval(() => {
            requestTimeInSec -= 1;

            if (requestTimeInSec <= 0) {
                canRequest = true;
                requestTimeInSec = 5;
            }
        }, 1_000);
    })

    async function getNextQuestion() {
        if (!canRequest) return;

        try {
            canRequest = false;
            requestTimeInSec = 5;
            const randomDifficulty = Math.random() > 0.5 ? 'easy' : 'medium';
            const response = await fetch(`https://opentdb.com/api.php?amount=1&encode=base64&difficulty=${randomDifficulty}${selectedCategory ? `&category=${selectedCategory}` : ''}`);
            const data = await response.json();
            difficulty = randomDifficulty;
            question = atob(data.results[0].question);
            answers = data.results[0].incorrect_answers.map((text: string) => ({ text: atob(text) })).concat({ text: atob(data.results[0].correct_answer), correct: true });
            shuffle(answers);
            timeLeft = maxTime;
        } catch {
            question = 'Failed to fetch question';
            answers = [{ text: '' }, { text: '', correct: true }, { text: '' }, { text: '' }];
        }
    }

	function update() {
        if (!browser) return;

		if (timeLeft <= 0) {
			timeLeft = 0;
			timeString = "Time's up!";
			return;
		}

		if (timerStopped) {
			return;
		}

		frame = requestAnimationFrame(update);

		const time = window.performance.now();
		timeLeft -= Math.min(time - lastTime, 1000);
		timeString = `${(timeLeft / 1000).toFixed(2)}s`;
		lastTime = time;
	};

    $effect(() => {
        localStorage.setItem('players', JSON.stringify(players));
    });

	onDestroy(() => {
        if (!browser) return;
		cancelAnimationFrame(frame);
        clearInterval(timer);
	});

	function toggleTimer() {
        if (!browser) return;

		timerStopped = !timerStopped;

        if (!timerStopped) {
            lastTime = window.performance.now();
            frame = requestAnimationFrame(update);
        } else {
            cancelAnimationFrame(frame);
        }
	}

    function addPlayer() {
        const playerName = document.querySelector<HTMLInputElement>('input[name="playerName"]')?.value;

        if (!playerName) return;

        players.push({ name: playerName, score: 0 });
    }

    function clearPlayers() {
        players = [];
    }

    function nthLetter(n: number) {
        return String.fromCharCode(65 + n);
    }
</script>

<div class="flex flex-col items-center text-2xl xl:w-2/3 w-11/12">
	{timeString}
	<div class="bg-gray-100 rounded-full h-2 w-full mt-2">
		<div
			class="h-2 rounded-full"
			class:bg-green-500={timeLeft / maxTime > 0.5}
			class:bg-orange-500={timeLeft / maxTime <= 0.5 && timeLeft / maxTime > 0.2}
			class:bg-red-500={timeLeft / maxTime <= 0.2}
			style:width={`${(timeLeft / maxTime) * 100}%`}
		></div>
	</div>
	<div class="mt-8 w-full">
		[<span class:text-green-500={difficulty === "easy"} class:text-orange-500={difficulty === "medium"}>{difficulty.toUpperCase()}</span>] {question}
	</div>
	<div class="p-2 w-full mt-8">
        {#each answers as answer, i}
        <div class:text-green-500={answer.correct}>{nthLetter(i)}. {answer.text}</div>
        {/each}
	</div>
    <div class="flex gap-4 w-full">
        <select class="bg-slate-900 w-full rounded-md py-2 px-2 mt-8" bind:value={selectedCategory}>
            <option value={0}>Any category</option>
            {#each data.categories as category, i}
            <option value={category.id}>{category.name}</option>
            {/each}
        </select>
        <button class="bg-blue-600 w-full py-2 rounded-md mt-8 basis-1/3 disabled:opacity-50" onclick={getNextQuestion} disabled={!canRequest}>Next question</button>
    </div>
	<button
		class="w-full py-2 rounded-md mt-4"
		class:bg-red-600={!timerStopped}
		class:bg-green-600={timerStopped}
		onclick={toggleTimer}
	>
		{timerStopped ? "Start question" : "Stop question"}
	</button>
    <div class="mt-8 w-full grid grid-cols-5">
        {#each players as player}
        <div class="flex flex-col items-center border border-2 w-fit p-4 rounded-md">
            <div>{player.name}</div>
            <div class="mt-4">
                <button class="bg-red-600 py-2 px-4 rounded-md" onclick={() => player.score -= 1}>-</button>
                <span class="mx-2">{player.score}</span>
                <button class="bg-green-600 py-2 px-4 rounded-md" onclick={() => player.score += 1}>+</button>
            </div>
        </div>
        {/each}
    </div>
    <div class="flex gap-4 items-center mt-10 w-full">
        <input data-dashlane-disabled-on-field="true" name="playerName" type="text" class="bg-slate-900 w-full rounded-md py-2 px-2" placeholder="Player name" />
        <button class="bg-blue-600 w-full py-2 rounded-md basis-1/3 disabled:opacity-50" onclick={addPlayer}>Add</button>
    </div>
    <button class="bg-red-600 w-full py-2 mt-4 rounded-md disabled:opacity-50" onclick={clearPlayers}>Clear players</button>
</div>
