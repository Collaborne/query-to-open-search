import { FieldConfig } from '../../types';
import { RangeFilter } from '../range';

describe('RangeFilter', () => {
	test('adds range filters', async () => {
		const fieldConfig: FieldConfig = {
			type: 'range',
			indexField: 'createdAt',
		};

		const from = new Date('2013-09-06T00:00:00.000Z');
		const to = new Date('2023-10-15T00:00:00.000Z');
		const value = {
			from: String(from.getTime()),
			to: String(to.getTime()),
		};

		const actual = await new RangeFilter().create(fieldConfig, value);
		expect(actual).toEqual([
			{
				range: {
					createdAt: {
						gte: from.toISOString(),
						lte: to.toISOString(),
					},
				},
			},
		]);
	});

	test('resolves semantic calendar date filters', async () => {
		const fieldConfig: FieldConfig = {
			type: 'range',
			indexField: 'recordedAt',
		};

		const actual = await new RangeFilter().create(
			fieldConfig,
			{
				from: 'cal.d.prev@00:00',
				to: 'cal.d.now@00:00',
			},
			{
				now: () => new Date('2026-05-07T10:00:00.000Z'),
				timeZone: 'Europe/Amsterdam',
			},
		);

		expect(actual).toEqual([
			{
				range: {
					recordedAt: {
						gte: '2026-05-05T22:00:00.000Z',
						lte: '2026-05-06T21:59:59.999Z',
					},
				},
			},
		]);
	});
});
