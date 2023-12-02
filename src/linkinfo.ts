export async function getLinkpreview(url: string) {
	const reqUrl = new URL('https://whatslink.info/api/v1/link');
	reqUrl.searchParams.set('url', url);
	const response = await fetch(reqUrl.href, {
		cache: 'force-cache',
	});
	const result = (await response.json()) as {
		screenshots?: {
			screenshot: string;
		}[];
	};
	return result?.screenshots?.[0]?.screenshot;
}
