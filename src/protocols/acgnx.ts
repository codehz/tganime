import rss from './rss';
import { ProtocolSupport } from './types';

export default {
	...rss,
	name: 'acgnx',
	async tryParseUrl(url) {
		const parsed = new URL(url);
		if (parsed.hostname !== 'share.acgnx.se') return null;
		const keyword = parsed.searchParams.get('keyword');
		if (!keyword) return null;
		if (parsed.pathname === '/rss.xml' || parsed.pathname === '/search.php')
			return `acgnx://${parsed.hostname}/rss.xml${parsed.search}`;
		return rss.tryParseUrl(url, 'acgnx');
	},
} satisfies ProtocolSupport;
