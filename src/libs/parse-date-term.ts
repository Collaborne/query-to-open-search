import { addWeeks, subWeeks, addDays, subDays } from 'date-fns';

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

export function parseDateTerm(term?: string) {
	if (!term) {
		return null;
	}
	// return the date if the term is a date representation (MM/DD/YYYY)
	const date = new Date(parseInt(term));
	if (isValidDate(date)) {
		return date;
	}
	const now = new Date();

	if (isNow(term)) {
		return now;
	}

	if (isDay(term)) {
		const nbrOfDays = extractNumberFromTerm(term);
		if (!isNaN(nbrOfDays)) {
			if (isAdd(term)) {
				return addDays(now, nbrOfDays);
			} else if (isSub(term)) {
				return subDays(now, nbrOfDays);
			}
		}
	}

	if (isWeek(term)) {
		const nbrOfWeeks = extractNumberFromTerm(term);
		if (!isNaN(nbrOfWeeks)) {
			if (isAdd(term)) {
				return addWeeks(now, nbrOfWeeks);
			} else if (isSub(term)) {
				return subWeeks(now, nbrOfWeeks);
			}
		}
	}

	return null;
}
