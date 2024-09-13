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

    let question = $state('Question');
    let difficulty = $state('easy');
    let answers = $state([{ text: '' }, { text: '', correct: true }, { text: '' }, { text: '' }]);
    let selectedCategory = $state(0);
    let timer: number;

    let { data } = $props();

    onMount(() => {
        timer = setInterval(() => {
            requestTimeInSec -= 1;
            console.log(requestTimeInSec);

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
            const parse = (text: string) => new DOMParser().parseFromString(text, 'text/html').body.textContent;
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

    function nthLetter(n: number) {
        return String.fromCharCode(65 + n);
    }
</script>

<div class="flex flex-col items-center text-2xl w-1/2">
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
</div>
