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
});
