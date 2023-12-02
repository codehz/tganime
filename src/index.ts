import './commands';

import { webhookCallback } from 'grammy';
import { UserFromGetMe } from 'grammy/types';
import { bot } from './bot';
import { genv } from './global';
import { populate } from './populate';
import { Env } from './types';

declare global {
	const BOT_TOKEN: string;
	const BOT_INFO: UserFromGetMe;
	const BOT_SECRET: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		Object.assign(genv, env);
		const url = new URL(request.url);
		if (request.method !== 'POST' || url.pathname.slice(1) !== BOT_SECRET) {
			return new Response('Not Found', { status: 404 });
		}
		return webhookCallback(bot, 'cloudflare-mod')(request);
	},
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		Object.assign(genv, env);
		await populate();
	},
};
