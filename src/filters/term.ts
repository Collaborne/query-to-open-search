import type { FieldConfig } from '../types.js';

import type { Filter } from './types.js';

export class TermFilter implements Filter<string[]> {
	async create(fieldConfig: FieldConfig, values: string[]) {
		let resolvedValues: string[] = [];

		if (fieldConfig.resolve) {
			resolvedValues = await fieldConfig.resolve(values);
		} else {
			resolvedValues = values;
		}

		const terms = resolvedValues.map((value: string) => ({
			term: { [fieldConfig.indexField]: value },
		}));

		return terms;
	}
}
