/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldConfig } from '../types';

export interface Filter<T = any> {
	create(fieldConfig: FieldConfig, values: T): Promise<Record<string, any>[]>;
}
