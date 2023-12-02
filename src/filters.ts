import { Context } from 'grammy';
import { isAdmin, isPrivateChat, isSupergroup } from 'grammy-guard';

export function isPrivateChatOrAdmin<C extends Context>(ctx: C) {
	return isPrivateChat(ctx) || isAdmin(ctx);
}

export function isForum<C extends Context>(ctx: C) {
	return isSupergroup(ctx) && ctx.chat.is_forum!;
}
