/**
 * The library "search-query-parser" removes the quotes from the text. So, we need to process
 * this ourselves.
 *
 * @see https://github.com/nepsilon/search-query-parser/issues/25
 */
export function getQuotedTexts(text?: string) {
	if (!text || text.length === 0) {
		return [];
	}

	// Find quoted text (but ignore if it's the value of a keyword query)
	const regex = /(?<!\w:)"((?:[^"\\]|\\.)*)"/g;
	const matches = text.match(regex);
	if (!matches || matches.length === 0) {
		return [];
	}

	const quotedTexts: string[] = [];

	matches.forEach(match => {
		const quotedText = match.slice(1, -1).replace(/\\"/g, '"');
		if (quotedText.length === 0) {
			return;
		}
		quotedTexts.push(quotedText);
	});
	return quotedTexts;
}
