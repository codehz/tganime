import { extractInfoFromRss } from './rss';
import { ProtocolSupport } from './types';

export default {
	name: 'acgnx',
	async fetch(url) {
		const parsed = new URL(url);
		const filters = parsed.searchParams.getAll('filter');
		const reqUrl = `https://${parsed.hostname}${parsed.pathname}${parsed.search}`;
		const response = await fetch(reqUrl);
		const text = await response.text();
		const list = extractInfoFromRss(text, filters);
		return list.toReversed();
	},
	async tryParseUrl(url) {
		const parsed = new URL(url);
		if (parsed.hostname !== 'share.acgnx.se') return null;
		const keyword = parsed.searchParams.get('keyword');
		if (!keyword) return null;
		if (parsed.pathname === '/rss.xml' || parsed.pathname === '/search.php')
			return `acgnx://${parsed.hostname}/rss.xml${parsed.search}`;
		else if (parsed.pathname.endsWith('.xml')) return `acgnx://${parsed.hostname}${parsed.pathname}${parsed.search}`;
		return null;
	},
} satisfies ProtocolSupport;
