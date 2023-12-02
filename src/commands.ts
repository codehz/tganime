import escapeHTML from 'escape-html';
import { guard, isAdmin, isSupergroup, reply } from 'grammy-guard';
import { nanoid } from 'nanoid';
import { bot } from './bot';
import { isForum, isPrivateChatOrAdmin } from './filters';
import { genv } from './global';
import { isNanoid } from './is-nanoid';
import protocols from './protocols';
import { renderSourceListItem } from './render';

bot.command('start', async (ctx) => {
	if (ctx.message) {
		try {
			await ctx.reply(`${ctx.chat.id}|${ctx.message.message_id}|${ctx.message.message_thread_id}`, {
				reply_to_message_id: ctx.message.message_id,
			});
		} catch (e) {
			console.error(e);
		}
	} else {
		await ctx.reply('No message found');
	}
});

bot.command('list', guard(isPrivateChatOrAdmin), async (ctx) => {
	if (!ctx.message) return;
	const chat_id = ctx.chat.id;
	const thread_id = ctx.message.message_thread_id ?? 0;
	const res = await genv.DB.prepare(
		'SELECT id, title, url FROM sources WHERE chat_id = ? AND thread_id = ? ORDER BY title'
	)
		.bind(chat_id, thread_id)
		.all<{ id: string; title: string; url: string }>();
	if (res.success) {
		await ctx.reply(`LIST in ${chat_id}|${thread_id}:\n` + res.results.map(renderSourceListItem).join('\n'), {
			parse_mode: 'HTML',
		});
	}
	if (ctx.chat.type !== 'private')
		try {
			await ctx.deleteMessage();
		} catch {}
});

bot.command('listall', guard(isPrivateChatOrAdmin), async (ctx) => {
	if (!ctx.message) return;
	const chat_id = ctx.chat.id;
	const res = await genv.DB.prepare('SELECT id, title, url FROM sources WHERE chat_id = ? ORDER BY title')
		.bind(chat_id)
		.all<{ id: string; title: string; url: string }>();
	if (res.success) {
		await ctx.reply(`LIST in ${chat_id}:\n` + res.results.map(renderSourceListItem).join('\n'), { parse_mode: 'HTML' });
	}
	if (ctx.chat.type !== 'private')
		try {
			await ctx.deleteMessage();
		} catch {}
});

bot.command(`add`, guard(isPrivateChatOrAdmin), async (ctx) => {
	if (!ctx.message) return;
	const matched = ctx.match.match(/(?<title>^(?:[^|])+)\|(?<url>(?:(?<protocol>\w+):\/\/).+)$/)?.groups as
		| {
				title: string;
				url: string;
				protocol: string;
		  }
		| undefined;
	if (ctx.chat.type !== 'private')
		try {
			await ctx.deleteMessage();
		} catch {}
	if (!matched) {
		await ctx.reply(`invalid syntax`);
		return;
	}
	const url = resolveProtocolAndUrl(matched.url, matched.protocol);
	if (!url) {
		await ctx.reply(`invalid url`);
		return;
	}
	const id = nanoid();
	const chat_id = ctx.chat.id;
	const thread_id = ctx.message.message_thread_id ?? 0;
	await genv.DB.prepare('INSERT INTO sources (id, chat_id, thread_id, title, url) VALUES (?, ?, ?, ?, ?)')
		.bind(id, chat_id, thread_id, matched.title, url)
		.run();
	await ctx.reply(`✅source <b>${matched.title}</b>(<code>${escapeHTML(url)}</code>) has been added`, {
		parse_mode: 'HTML',
	});
});

function resolveProtocolAndUrl(url: string, protocol: string) {
	if (protocols.some((x) => x.name === protocol)) return url;
	for (const protocol of protocols) {
		if (protocol.tryParseUrl) {
			const result = protocol.tryParseUrl(url);
			if (result) return result;
		}
	}
	return null;
}

bot.command(`delete`, guard(isPrivateChatOrAdmin), async (ctx) => {
	if (!ctx.message) return;
	const id = ctx.match;
	if (!isNanoid(id)) {
		await ctx.reply(`invalid syntax, use /delete <id>`);
		return;
	}
	if (ctx.chat.type !== 'private')
		try {
			await ctx.deleteMessage();
		} catch {}
	const chat_id = ctx.chat.id;
	const res = await genv.DB.prepare('DELETE FROM sources WHERE id = ? AND chat_id = ? RETURNING title, url')
		.bind(id, chat_id)
		.all<{ title: string; url: string }>();
	const item = res.results[0];
	if (!res.success || item == null) {
		await ctx.reply(`source ${id} not found`);
		return;
	}
	await ctx.reply(`✅source <b>${escapeHTML(item.title)}</b>(<code>${escapeHTML(item.url)}</code>) has been deleted`, {
		parse_mode: 'HTML',
	});
	return;
});

bot.command(`create`, guard(isForum, reply('forum required')), guard(isAdmin), async (ctx) => {
	if (!ctx.message) return;
	const matched = ctx.match.match(/(?<title>^(?:[^|])+)\|(?<url>(?:(?<protocol>\w+):\/\/).+)$/)?.groups as
		| {
				title: string;
				url: string;
				protocol: string;
		  }
		| undefined;
	if (ctx.chat.type !== 'private')
		try {
			await ctx.deleteMessage();
		} catch {}
	if (!matched) {
		await ctx.reply(`invalid syntax`);
		return;
	}
	const url = resolveProtocolAndUrl(matched.url, matched.protocol);
	if (!url) {
		await ctx.reply(`invalid url`);
		return;
	}
	const id = nanoid();
	const chat_id = ctx.chat.id;
	const thread = await ctx.api.createForumTopic(chat_id, matched.title);
	const thread_id = thread.message_thread_id;
	await genv.DB.prepare('INSERT INTO sources (id, chat_id, thread_id, title, url) VALUES (?, ?, ?, ?, ?)')
		.bind(id, chat_id, thread_id, matched.title, url)
		.run();
	await ctx.reply(`✅forum topic and source <b>${matched.title}</b>(<code>${escapeHTML(url)}</code>) has been added`, {
		parse_mode: 'HTML',
	});
	await ctx.api.closeForumTopic(chat_id, thread_id);
});
