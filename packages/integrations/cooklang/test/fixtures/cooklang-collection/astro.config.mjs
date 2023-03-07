import { defineConfig } from 'astro/config';
import cooklang from '@astrojs/cooklang';

// https://astro.build/config
export default defineConfig({
	integrations: [cooklang()],
});
