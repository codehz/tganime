import { Bot } from 'grammy';

export const bot = new Bot(BOT_TOKEN, { botInfo: BOT_INFO });

bot.use(async (ctx, next) => {
	try {
		await next();
	} catch (e) {
		console.error(e);
	}
});
