import { addWeeks, subWeeks, addDays, subDays } from 'date-fns';

const ISO_DATE_ONLY_REGEX = /^\d{4}_\d{2}_\d{2}$/;
const ISO_DATETIME_REGEX =
	/^\d{4}_\d{2}_\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function normalizeIsoSeparators(term: string) {
	return term.includes('_') ? term.replace(/_/g, '-') : term;
}

function isWeek(term: string) {
	return term.endsWith('w');
}

function isDay(term: string) {
	return term.endsWith('d');
}

function isAdd(term: string) {
	return term.startsWith('now_add_');
}

function isSub(term: string) {
	return term.startsWith('now_sub_');
}

function isNow(term: string) {
	return term === 'now';
}

function extractNumberFromTerm(term: string) {
	const matches = term.match(/\d+/);
	if (matches) {
		return parseInt(matches[0], 10);
	}
	return NaN;
}

function isValidDate(date: Date): boolean {
	// Check if date is not null and is not "Invalid Date"
	return date instanceof Date && !isNaN(date.getTime());
}

function parseIsoDate(term: string) {
	if (!ISO_DATE_ONLY_REGEX.test(term) && !ISO_DATETIME_REGEX.test(term)) {
		return null;
	}

	const normalizedTerm = normalizeIsoSeparators(term);
	const date = new Date(normalizedTerm);
	return isValidDate(date) ? date : null;
}

function parseEpoch(term: string) {
	if (!/^-?\d+$/.test(term)) {
		return null;
	}

	const epoch = parseInt(term, 10);
	const milliseconds = term.length <= 10 ? epoch * 1000 : epoch;
	const date = new Date(milliseconds);
	return isValidDate(date) ? date : null;
}

export function parseDateTerm(
	term: string | undefined,
	// Visible for testing
	now = () => new Date(),
) {
	if (!term) {
		return null;
	}

	// Return the date if the term is an ISO date (date or datetime).
	const isoDate = parseIsoDate(term);
	if (isoDate) {
		return isoDate;
	}

	// Return the date if the term is an epoch representation (seconds or milliseconds).
	const epochDate = parseEpoch(term);
	if (epochDate) {
		return epochDate;
	}

	const nowDate = now();

	if (isNow(term)) {
		return nowDate;
	}

	if (isDay(term)) {
		const nbrOfDays = extractNumberFromTerm(term);
		if (!isNaN(nbrOfDays)) {
			if (isAdd(term)) {
				return addDays(nowDate, nbrOfDays);
			} else if (isSub(term)) {
				return subDays(nowDate, nbrOfDays);
			}
		}
	}

	if (isWeek(term)) {
		const nbrOfWeeks = extractNumberFromTerm(term);
		if (!isNaN(nbrOfWeeks)) {
			if (isAdd(term)) {
				return addWeeks(nowDate, nbrOfWeeks);
			} else if (isSub(term)) {
				return subWeeks(nowDate, nbrOfWeeks);
			}
		}
	}

	return null;
}
