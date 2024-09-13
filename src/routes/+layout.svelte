<script lang="ts">
    import "../app.css";

    let { children } = $props();
</script>

<div class="bg-slate-800 h-lvh w-lvw text-white flex justify-center p-10">
    {@render children()}
</div>