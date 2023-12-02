import { extractInfoFromRss } from './rss';
import { ProtocolSupport } from './types';

export default {
	name: 'acgnx',
	async fetch(url) {
		const parsed = new URL(url);
		const reqUrl = new URL(`https://${parsed.hostname}/rss.xml`);
		reqUrl.searchParams.append('keyword', decodeURIComponent(parsed.pathname.slice(1)));
		const filters = parsed.searchParams.getAll('filter');
		const response = await fetch(reqUrl.href);
		const list = await extractInfoFromRss(response as any, filters);
		return list.toReversed();
	},
	tryParseUrl(url) {
		const parsed = new URL(url);
		if (parsed.hostname !== 'share.acgnx.se') return null;
		const keyword = parsed.searchParams.get('keyword');
		if (!keyword) return null;
		if (parsed.pathname === '/rss.xml' || parsed.pathname === '/search.php')
			return `acgnx://${parsed.hostname}/${encodeURIComponent(keyword)}`;
		return null;
	},
} satisfies ProtocolSupport;
