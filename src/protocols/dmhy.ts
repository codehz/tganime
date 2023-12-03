import rss from './rss';
import { ProtocolSupport } from './types';

export default {
	...rss,
	name: 'dmhy',
	async tryParseUrl(url) {
		const parsed = new URL(url);
		if (parsed.hostname !== 'dmhy.org') return null;
		if (parsed.pathname.endsWith('/rss.xml')) return `dmhy://${parsed.hostname}${parsed.pathname}${parsed.search}`;
		return rss.tryParseUrl(url, 'dmhy');
	},
} satisfies ProtocolSupport;
