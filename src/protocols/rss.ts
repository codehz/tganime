import { parseRSS } from '../parser';
import { AnimeInfo } from './types';

export async function extractInfoFromRss(response: Response, filters: string[] = []) {
	const text = await response.text();
	const parsed = parseRSS(text);
	if (!parsed.rss?.channel?.item?.length) return [];
	const sources = parsed.rss.channel.item;
	return sources.flatMap((x) => {
		if (!filters.every((item) => x.title['#text'].includes(item))) return [];
		const magnet = x.enclosure?.$url;
		if (!magnet) return [];
		const parsedMagnet = new URL(magnet);
		const matched = parsedMagnet.searchParams.get('xt')!.match(/urn:btih:(?<btih>[a-z0-9]{40})/);
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
