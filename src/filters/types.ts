/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FieldConfig, QueryBuilderOptions } from '../types.js';

export interface Filter<T = any> {
	create(
		fieldConfig: FieldConfig,
		values: T,
		options?: QueryBuilderOptions,
	): Promise<Record<string, any>[]>;
}
