import type { Load } from '@sveltejs/kit';

export const load: Load = async () => {
    let categories: { id: string, name: string }[] = [];

    try {
        const res = await fetch('https://opentdb.com/api_category.php')
        const data = await res.json();
        categories = data.trivia_categories;
    } catch (e) {
        console.error(e);
    }

    return {
        categories
    };
}