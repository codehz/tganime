import escapeHTML from 'escape-html';

export type SourceListItem = { id: string; title: string; url: string };

export function renderSourceListItem({ id, title, url }: SourceListItem) {
	return `<b>${escapeHTML(title)}</b>(<code>${id}</code>): <code>${escapeHTML(url)}</code>`;
}
