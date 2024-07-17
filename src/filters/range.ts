import { parseDateTerm } from '../libs/parse-date-term';
import { FieldConfig } from '../types';

import { Filter } from './types';

export class RangeFilter implements Filter<{ from: string; to: string }> {
	async create(fieldConfig: FieldConfig, value: { from: string; to: string }) {
		const from = parseDateTerm(value.from);
		const to = parseDateTerm(value.to);

		if (!from || !to) {
			return [];
		}

		const rangeQuery = {
			range: {
				[fieldConfig.indexField]: {
					gte: from.toISOString(),
					lte: to.toISOString(),
				},
			},
		};

		return [rangeQuery];
	}
}
