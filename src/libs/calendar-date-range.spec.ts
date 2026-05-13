import { resolveCalendarDateRange } from './calendar-date-range';

describe('resolveCalendarDateRange', () => {
	it('resolves last yesterday in an IANA timezone', () => {
		const range = resolveCalendarDateRange({
			from: 'cal.d.prev@00:00',
			to: 'cal.d.now@00:00',
			now: new Date('2026-05-07T10:00:00.000Z'),
			timeZone: 'Europe/Amsterdam',
		});

		expect(range?.from.toISOString()).toBe('2026-05-05T22:00:00.000Z');
		expect(range?.to.toISOString()).toBe('2026-05-06T21:59:59.999Z');
	});

	it('resolves last week (Monday to Sunday)', () => {
		const range = resolveCalendarDateRange({
			from: 'cal.w.prev@00:00',
			to: 'cal.w.now@00:00',
			now: new Date('2026-05-07T10:00:00.000Z'),
			timeZone: 'Europe/Amsterdam',
		});

		expect(range?.from.toISOString()).toBe('2026-04-26T22:00:00.000Z');
		expect(range?.to.toISOString()).toBe('2026-05-03T21:59:59.999Z');
	});

	it('supports non-midnight local boundary times', () => {
		const range = resolveCalendarDateRange({
			from: 'cal.d.prev@12:30',
			to: 'cal.d.now@12:30',
			now: new Date('2026-05-07T10:00:00.000Z'),
			timeZone: 'Europe/Amsterdam',
		});

		expect(range?.from.toISOString()).toBe('2026-05-06T10:30:00.000Z');
		expect(range?.to.toISOString()).toBe('2026-05-07T10:29:59.999Z');
	});

	it('supports explicit previous day offsets', () => {
		const range = resolveCalendarDateRange({
			from: 'cal.d.prev_2@00:00',
			to: 'cal.d.prev_1@00:00',
			now: new Date('2026-05-07T10:00:00.000Z'),
			timeZone: 'Europe/Amsterdam',
		});

		expect(range?.from.toISOString()).toBe('2026-05-04T22:00:00.000Z');
		expect(range?.to.toISOString()).toBe('2026-05-05T21:59:59.999Z');
	});
});
