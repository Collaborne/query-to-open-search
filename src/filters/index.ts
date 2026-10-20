import type {
	FieldConfig,
	FieldType,
	LogicalConnect,
	QueryBuilderOptions,
} from '../types.js';

import { RangeFilter } from './range.js';
import { TermFilter } from './term.js';
import { TextFilter } from './text.js';
import type { Filter } from './types.js';

const DEFAULT_LOGICAL_CONNECT: LogicalConnect = 'OR';

export class Filters implements Filter {
	private filterHandlers: Record<FieldType, Filter>;

	constructor() {
		this.filterHandlers = {
			term: new TermFilter(),
			range: new RangeFilter(),
			text: new TextFilter(),
		};
	}

	async create(
		fieldConfig: FieldConfig,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		values: any,
		options?: QueryBuilderOptions,
	) {
		const handler = this.filterHandlers[fieldConfig.type];
		const filters = await handler.create(fieldConfig, values, options);

		const logicalConnect =
			fieldConfig.logicalConnect ?? DEFAULT_LOGICAL_CONNECT;

		if (logicalConnect === 'OR' && filters.length > 1) {
			return [
				{
					bool: {
						should: filters,
						minimum_should_match: 1, // At least one of the match queries must return true
					},
				},
			];
		} else {
			return filters;
		}
	}
}
