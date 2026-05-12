/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldConfig, QueryBuilderOptions } from '../types';

export interface Filter<T = any> {
	create(
		fieldConfig: FieldConfig,
		values: T,
		options?: QueryBuilderOptions,
	): Promise<Record<string, any>[]>;
}
