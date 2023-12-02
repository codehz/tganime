import { extractInfoFromRss } from './rss';
import { ProtocolSupport } from './types';

export default {
	name: 'dmhy',
	async fetch(url) {
		const parsed = new URL(url);
		const filters = parsed.searchParams.getAll('filter');
		const response = await fetch(`https://${parsed.hostname}${parsed.pathname}${parsed.search}`);
		const list = await extractInfoFromRss(response as any, filters);
		return list.toReversed();
	},
	tryParseUrl(url) {
		const parsed = new URL(url);
		if (parsed.hostname !== 'dmhy.org') return null;
		if (!parsed.pathname.endsWith('rss.xml')) return null;
		return `dmhy://${parsed.hostname}${parsed.pathname}${parsed.search}`;
	},
} satisfies ProtocolSupport;
