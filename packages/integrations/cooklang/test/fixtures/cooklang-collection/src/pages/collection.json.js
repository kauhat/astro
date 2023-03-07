import { getCollection } from 'astro:content';
import { stringify } from 'devalue';

export async function get() {
	const posts = await getCollection('recipes');

	return {
		body: stringify(posts.map(({render, ...entry}) => entry))
	};
}
