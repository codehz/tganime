import { XMLParser } from 'fast-xml-parser';

type XMLTextNode = {
	'#text': string;
};

const parser = new XMLParser({ attributeNamePrefix: '$', ignoreAttributes: false, alwaysCreateTextNode: true });
export function parseRSS(input: string) {
	return parser.parse(input) as {
		rss: {
			channel: {
				title: XMLTextNode;
				link: XMLTextNode;
				description: XMLTextNode;
				item: Array<{
					title: XMLTextNode;
					link: XMLTextNode;
					description: XMLTextNode;
					guid: XMLTextNode;
					enclosure: {
						$url: string;
						$type: string;
					};
					pubDate: XMLTextNode;
				}>;
			};
		};
	};
}
