export function isNanoid(str: string): boolean {
	return /^[a-zA-Z0-9_-]{21}$/.test(str);
}
