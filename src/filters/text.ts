import { FieldConfig } from '../types';

import { Filter } from './types';

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
