import { resolveCalendarDateRange } from '../libs/calendar-date-range';
import { parseDateTerm } from '../libs/parse-date-term';
import { FieldConfig, QueryBuilderOptions } from '../types';

import { Filter } from './types';

type RangeValue = { from: string; to: string };

function createRangeQuery(indexField: string, from: Date, to: Date) {
	return {
		range: {
			[indexField]: {
				gte: from.toISOString(),
				lte: to.toISOString(),
			},
		},
	};
}

export class RangeFilter implements Filter<RangeValue> {
	async create(
		fieldConfig: FieldConfig,
		value: RangeValue,
		options?: QueryBuilderOptions,
	) {
		const calendarRange = resolveCalendarDateRange({
			from: value.from,
			to: value.to,
			now: options?.now?.() ?? new Date(),
			timeZone: options?.timeZone,
		});
		if (calendarRange) {
			return [
				createRangeQuery(
					fieldConfig.indexField,
					calendarRange.from,
					calendarRange.to,
				),
			];
		}

		const from = parseDateTerm(value.from);
		const to = parseDateTerm(value.to);

		if (!from || !to) {
			return [];
		}

		return [createRangeQuery(fieldConfig.indexField, from, to)];
	}
}
