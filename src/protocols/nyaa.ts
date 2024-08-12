import rss from './rss';
import { ProtocolSupport } from './types';

export default {
	...rss,
	name: 'nyaa',
	async tryParseUrl(url) {
		const parsed = new URL(url);
		if (parsed.hostname !== 'nyaa.si' && parsed.hostname !== 'sukebei.nyaa.si') return null;
		if (parsed.searchParams.get('page') !== 'rss' || parsed.pathname !== '/') return null;
		return `nyaa://${parsed.hostname}/${parsed.search}`;
	},
} satisfies ProtocolSupport;
