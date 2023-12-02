import './commands';

import escapeHTML from 'escape-html';
import { webhookCallback } from 'grammy';
import { UserFromGetMe } from 'grammy/types';
import { bot } from './bot';
import { genv } from './global';
import protocols from './protocols';
import { AnimeInfo } from './protocols/types';
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
		const res = await genv.DB.prepare(
			`select url, json_group_array(json_object('id', id, 'chat_id', chat_id, 'thread_id', thread_id)) as list from sources group by url;`
		).all<{ url: string; list: string }>();
		if (!res.success) {
			console.error(res.error!);
			return;
		}
		const check = genv.DB.prepare(
			'INSERT OR IGNORE INTO sent (source_id, nonce) SELECT ?, JS.value FROM json_each(?) JS RETURNING nonce'
		);
		await Promise.all(
			res.results.map(async ({ url, list }) => {
				const parsed = new URL(url);
				const protocolName = parsed.protocol.slice(0, -1);
				const protocol = protocols.find((protocol) => protocol.name === protocolName);
				if (!protocol) {
					console.warn(`unsupported protocol ${protocolName}`);
					return;
				}
				try {
					const results = await protocol.fetch(url);
					if (results.length === 0) return;
					const targets = JSON.parse(list) as { id: string; chat_id: number; thread_id: number }[];
					for (const target of targets) {
						const inserted = await check
							.bind(target.id, JSON.stringify(results.map((x) => x.btih)))
							.all<{ nonce: string }>();
						if (!inserted.success) continue;
						const allowlist = inserted.results.map((x) => x.nonce);
						try {
							const resolved = {
								chat_id: target.chat_id,
								message_thread_id: target.thread_id === 0 ? undefined : target.thread_id,
							};
							for (const result of results.filter((x) => allowlist.includes(x.btih))) {
								await sendResult(result, resolved);
							}
						} catch (e) {
							console.error(`when send ${url} to ${target.chat_id}|${target.thread_id}`);
							console.error(e);
						}
					}
				} catch (e) {
					console.error(`when handle ${url}`);
					console.error(e);
				}
			})
		);
	},
};

async function sendResult(
	result: AnimeInfo,
	{ chat_id, message_thread_id }: { chat_id: number; message_thread_id?: number }
) {
	const text = [
		`<b>${escapeHTML(result.title)}</b>`,
		result.description,
		`🔗<a href="${result.link}">访问网页</a>`,
		`🧲<code>${result.magnet}</code>`,
	]
		.filter(Boolean)
		.join('\n');
	if (result.preview) {
		await bot.api.sendPhoto(chat_id, result.preview, {
			caption: text,
			message_thread_id,
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [[{ text: 'Save to PikPak', url: `https://t.me/pikpak_bot?start=magnet_${result.btih}` }]],
			},
		});
	} else {
		await bot.api.sendMessage(chat_id, text, {
			message_thread_id,
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [[{ text: 'Save to PikPak', url: `https://t.me/pikpak_bot?start=magnet_${result.btih}` }]],
			},
		});
	}
}
