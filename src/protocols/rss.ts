import { parseRSS } from '../parser';
import { AnimeInfo } from './types';
import { ProtocolSupport } from './types';

export function extractInfoFromRss(input: string, filters: string[] = []) {
	const parsed = parseRSS(input);
	if (!parsed.rss?.channel?.item) return [];
	let sources = parsed.rss.channel.item;
	if (!Array.isArray(sources)) sources = [sources];
	if (!sources.length) return [];
	return sources.flatMap((x) => {
		if (!filters.every((item) => x.title['#text'].includes(item))) return [];
		const magnet = x.enclosure?.$url;
		if (!magnet) return [];
		const parsedMagnet = new URL(magnet);
		const matched = parsedMagnet.searchParams.get('xt')!.match(/urn:btih:(?<btih>[a-z0-9]+)/i);
		if (!matched) return [];
		const btih = matched.groups!.btih;
		return {
			title: x.title['#text'],
			link: x.link['#text'],
			description: x.description?.['#text'],
			magnet,
			btih,
		} satisfies AnimeInfo;
	});
}

export default {
	name: 'rss',
	async fetch(url) {
		const parsed = new URL(url);
		const filters = parsed.searchParams.getAll('filter');
		const reqUrl = `https://${parsed.hostname}${parsed.pathname}${parsed.search}`;
		const response = await fetch(reqUrl);
		const text = await response.text();
		const list = extractInfoFromRss(text, filters);
		return list.toReversed();
	},
	async tryParseUrl(url, protocol = 'rss') {
		const response = await fetch(url);
		if (response.headers.get('content-type')?.includes('text/xml')) {
			const parsed = new URL(url);
			return `${protocol}://${parsed.hostname}${parsed.pathname}${parsed.search}`;
		}
		let finalURL = '';
		const transform = new HTMLRewriter()
			.on('link[type="application/rss+xml"]', {
				element(element) {
					const href = element.getAttribute('href');
					if (!href) return;
					finalURL = new URL(href!, url).href;
				},
			})
			.transform(response as any);
		await transform.text();
		if (finalURL) {
			const parsed = new URL(finalURL);
			return `${protocol}://${parsed.hostname}${parsed.pathname}${parsed.search}`;
		}
		return null;
	},
} satisfies ProtocolSupport;
