import type { FieldConfig } from '../types.js';

import type { Filter } from './types.js';

export class TextFilter implements Filter<string[]> {
	async create(fieldConfig: FieldConfig, values: string[]) {
		const filters = values.map((value: string) => ({
			match: {
				[fieldConfig.indexField]: value,
			},
		}));

		return filters;
	}
}
