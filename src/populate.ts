import escapeHTML from 'escape-html';
import { bot } from './bot';
import { genv } from './global';
import protocols from './protocols';
import { AnimeInfo } from './protocols/types';

export async function populate(filter_chat?: number) {
	const res = filter_chat
		? await genv.DB.prepare(
				`select url, json_group_array(json_object('id', id, 'chat_id', chat_id, 'thread_id', thread_id)) as list, min(last_fetch_at) as min_time from sources where chat_id = ? group by url order by min_time, random() limit 5;`
		  )
				.bind(filter_chat)
				.all<{ url: string; list: string }>()
		: await genv.DB.prepare(
				`select url, json_group_array(json_object('id', id, 'chat_id', chat_id, 'thread_id', thread_id)) as list, min(last_fetch_at) as min_time from sources group by url order by min_time, random() limit 5;`
		  ).all<{ url: string; list: string }>();
	if (!res.success) {
		console.error(res.error!);
		return;
	}
	const update_fetch_time = genv.DB.prepare(
		`UPDATE sources SET last_fetch_at = current_timestamp WHERE EXISTS (SELECT 1 FROM json_each(?) WHERE value = sources.id)`
	);
	const check = genv.DB.prepare(
		'SELECT JS.value as nonce FROM json_each(?) JS LEFT JOIN sent ON sent.source_id = ? AND sent.nonce = JS.value WHERE sent.nonce IS NULL'
	);
	const mark = genv.DB.prepare('INSERT INTO sent (source_id, nonce) VALUES (?, ?)');
	await Promise.all(
		res.results.map(async ({ url, list }) => {
			console.log('populate', url);
			const parsed = new URL(url);
			const protocolName = parsed.protocol.slice(0, -1);
			const protocol = protocols.find((protocol) => protocol.name === protocolName);
			if (!protocol) {
				console.warn(`unsupported protocol ${protocolName}`);
				return;
			}
			try {
				const targets = JSON.parse(list) as { id: string; chat_id: number; thread_id: number }[];
				await update_fetch_time.bind(JSON.stringify(targets.map((x) => x.id))).run();
				const results = await protocol.fetch(url);
				if (results.length === 0) return;
				for (const target of targets) {
					const inserted = await check
						.bind(JSON.stringify(results.map((x) => x.btih)), target.id)
						.all<{ nonce: string }>();
					if (!inserted.success) continue;
					const allowlist = inserted.results.map((x) => x.nonce);
					try {
						const resolved = {
							chat_id: target.chat_id,
							message_thread_id: target.thread_id === 0 ? undefined : target.thread_id,
						};
						for (const result of results.filter((x) => allowlist.includes(x.btih))) {
							try {
								await sendResult(result, resolved);
								await mark.bind(target.id, result.btih).run();
							} catch (e) {
								console.error(`when send ${result.title} to ${target.chat_id}|${target.thread_id}`);
								console.error(e);
							}
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
}

async function sendResult(
	result: AnimeInfo,
	{ chat_id, message_thread_id }: { chat_id: number; message_thread_id?: number }
) {
	const text = [
		`<b>${escapeHTML(result.title)}</b>`,
		`🔗<a href="${result.link}">访问网页</a>`,
		`🧲<code>magnet:?xt=urn:btih:${result.btih}</code>`,
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
