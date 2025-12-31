import { addDays, subDays, addWeeks, subWeeks } from 'date-fns';

import { parseDateTerm } from '../parse-date-term';

const NOW = new Date();

describe('parseDateTerm', () => {
	it('should return null for hyphenated ISO date string', () => {
		const isoDate = '2023-10-01';
		const result = parseDateTerm(isoDate);
		expect(result).toBeNull();
	});
	it('should return the date for an ISO date string using underscores', () => {
		const isoDate = '2023_10_01';
		const result = parseDateTerm(isoDate);
		expect(result?.toISOString()).toBe(new Date('2023-10-01').toISOString());
	});

	it('should return null for hyphenated ISO datetime string', () => {
		const isoDatetime = '2023-10-01T12:30:45Z';
		const result = parseDateTerm(isoDatetime);
		expect(result).toBeNull();
	});
	it('should return the date for an ISO datetime string using underscores', () => {
		const isoDatetime = '2023_10_01T12:30:45Z';
		const result = parseDateTerm(isoDatetime);
		expect(result?.toISOString()).toBe(
			new Date('2023-10-01T12:30:45Z').toISOString(),
		);
	});

	it('should return the date for epoch seconds', () => {
		const epochSeconds = '1699834414';
		const result = parseDateTerm(epochSeconds);
		const date = new Date(parseInt(epochSeconds, 10) * 1000);
		expect(result?.toISOString()).toBe(date.toISOString());
	});

	it('should return the current date for "now"', () => {
		const result = parseDateTerm('now', () => NOW);
		expect(result?.toDateString()).toBe(NOW.toDateString());
	});

	it('should add days correctly', () => {
		const daysToAdd = 5;
		const term = `now_add_${daysToAdd}d`;
		const result = parseDateTerm(term, () => NOW);
		const expectedDate = addDays(NOW, daysToAdd);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should subtract days correctly', () => {
		const daysToSubtract = 3;
		const term = `now_sub_${daysToSubtract}d`;
		const result = parseDateTerm(term, () => NOW);
		const expectedDate = subDays(NOW, daysToSubtract);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should add weeks correctly', () => {
		const weeksToAdd = 2;
		const term = `now_add_${weeksToAdd}w`;
		const result = parseDateTerm(term, () => NOW);
		const expectedDate = addWeeks(NOW, weeksToAdd);
		expect(result?.toDateString()).toBe(expectedDate.toDateString());
	});

	it('should subtract weeks correctly', () => {
		const weeksToSubtract = 1;
		const term = `now_sub_${weeksToSubtract}w`;
		const result = parseDateTerm(term, () => NOW);
		const expectedDate = subWeeks(NOW, weeksToSubtract);
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
