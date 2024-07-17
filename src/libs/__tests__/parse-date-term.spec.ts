import { addDays, subDays, addWeeks, subWeeks } from 'date-fns';

import { parseDateTerm } from '../parse-date-term';

describe('parseDateTerm', () => {
	it('should return the date for "date string"', () => {
		const result = parseDateTerm('1699834414144');
		const date = new Date(1699834414144);
		expect(result?.toDateString()).toBe(date.toDateString());
	});
	it('should return the current date for "now"', () => {
		const result = parseDateTerm('now');
		const now = new Date();
		expect(result?.toDateString()).toBe(now.toDateString());
	});

	it('should add days correctly', () => {
		const daysToAdd = 5;
		const term = `now_add_${daysToAdd}d`;
		const result = parseDateTerm(term);
		const expectedDate = addDays(new Date(), daysToAdd);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should subtract days correctly', () => {
		const daysToSubtract = 3;
		const term = `now_sub_${daysToSubtract}d`;
		const result = parseDateTerm(term);
		const expectedDate = subDays(new Date(), daysToSubtract);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should add weeks correctly', () => {
		const weeksToAdd = 2;
		const term = `now_add_${weeksToAdd}w`;
		const result = parseDateTerm(term);
		const expectedDate = addWeeks(new Date(), weeksToAdd);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should subtract weeks correctly', () => {
		const weeksToSubtract = 1;
		const term = `now_sub_${weeksToSubtract}w`;
		const result = parseDateTerm(term);
		const expectedDate = subWeeks(new Date(), weeksToSubtract);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should return null for an invalid term', () => {
		const invalidTerm = 'invalid';
		const result = parseDateTerm(invalidTerm);
		expect(result).toBeNull();
	});

	it('should return null for a term with an invalid format', () => {
		const invalidTerm = 'now_add_5x';
		const result = parseDateTerm(invalidTerm);
		expect(result).toBeNull();
	});
});
