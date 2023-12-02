export type AnimeInfo = {
	title: string;
  description?: string;
	magnet: string;
	btih: string;
	preview?: string;
	link: string;
};

export type ProtocolSupport = {
	name: string;
	fetch(url: string): Promise<AnimeInfo[]>;
	tryParseUrl?(url: string): string | null;
};
