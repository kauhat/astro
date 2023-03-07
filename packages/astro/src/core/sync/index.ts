import { dim } from 'kleur/colors';
import type fsMod from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createServer } from 'vite';
import type { AstroSettings } from '../../@types/astro';
import { createContentTypesGenerator } from '../../content/index.js';
import { globalContentConfigObserver } from '../../content/utils.js';
import { runHookConfigSetup } from '../../integrations/index.js';
import { setUpEnvTs } from '../../vite-plugin-inject-env-ts/index.js';
import { getTimeStat } from '../build/util.js';
import { createVite } from '../create-vite.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { info, LogOptions } from '../logger/core.js';

type ProcessExit = 0 | 1;

export async function syncCli(
	settings: AstroSettings,
	{ logging, fs }: { logging: LogOptions; fs: typeof fsMod }
): Promise<ProcessExit> {
	const resolvedSettings = await runHookConfigSetup({
		settings,
		logging,
		command: 'build',
	});
	return sync(resolvedSettings, { logging, fs });
}

export async function sync(
	settings: AstroSettings,
	{ logging, fs }: { logging: LogOptions; fs: typeof fsMod }
): Promise<ProcessExit> {
	const timerStart = performance.now();
	// Needed to load content config
	const tempViteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false },
				optimizeDeps: { entries: [] },
				logLevel: 'silent',
			},
			{ settings, logging, mode: 'build', command: 'build', fs }
		)
	);

	try {
		const contentTypesGenerator = await createContentTypesGenerator({
			contentConfigObserver: globalContentConfigObserver,
			logging,
			fs,
			settings,
			viteServer: tempViteServer,
		});
		const typesResult = await contentTypesGenerator.init();

		const contentConfig = globalContentConfigObserver.get();
		if (contentConfig.status === 'error') {
			throw contentConfig.error;
		}

		if (typesResult.typesGenerated === false) {
			switch (typesResult.reason) {
				case 'no-content-dir':
				default:
					info(logging, 'content', 'No content directory found. Skipping type generation.');
					return 0;
			}
		}
	} catch (e) {
		throw new AstroError(AstroErrorData.GenerateContentTypesError);
	} finally {
		await tempViteServer.close();
	}

	info(logging, 'content', `Types generated ${dim(getTimeStat(timerStart, performance.now()))}`);
	await setUpEnvTs({ settings, logging, fs });

	return 0;
}
