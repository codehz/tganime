export class TextExtractor {
	#buffer = '';
	#processor: (text: string) => void;
	constructor(processor: (text: string) => void) {
		this.#processor = processor;
	}
	text(text: Text) {
		this.#buffer += text.text;
		if (text.lastInTextNode) {
			const full = this.#buffer.trim();
			if (full.startsWith('<![CDATA[') && full.endsWith(']]>')) {
				this.#processor(full.slice(9, -3));
			} else this.#processor(full);
			this.#buffer = '';
		}
	}
}
