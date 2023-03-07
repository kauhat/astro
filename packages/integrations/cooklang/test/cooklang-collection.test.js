import cooklang from '@astrojs/cooklang';

import { expect } from 'chai';
import { parse as parseDevalue } from 'devalue';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Collection injection', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/cooklang-collection/', import.meta.url),
			integrations: [cooklang()],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('loads collection', async () => {
			const contents = await fixture.readFile('/collection.json');
			const posts = parseDevalue(contents);

			expect(posts).to.not.be.null;

			posts.map((post) => {
				expect(post).to.include.keys(['slug', 'data']);

				expect(post.data).to.have.keys([
					'ingredients',
					'cookwares',
					'metadata',
					'steps',
					'shoppingList',
				]);
			});
		});
	});
});
