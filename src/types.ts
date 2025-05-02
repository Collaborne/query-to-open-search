/* eslint-disable @typescript-eslint/naming-convention */
import { SearchParserResult } from 'search-query-parser';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface OpenSearchFilters {
	bool: {
		must: Record<string, any>[];
		// eslint-disable-next-line @typescript-eslint/naming-convention
		must_not: Record<string, any>[];
	};
}
export interface OpenSearchVectorQuery {
	knn: Record<string, KNNFieldQuery>;
}

export interface KNNFieldQuery {
	vector: number[];
	k?: number;
	max_distance?: number;
	min_score?: number;
	filter?: Record<string, any>;
}

export type OpenSearchQuery = OpenSearchFilters | OpenSearchVectorQuery;

export interface BuildResponse {
	query: OpenSearchQuery;
	parsedQuery?: SearchParserResult;
}
export interface QueryBuilder {
	build(queryString: string): Promise<BuildResponse>;
}

export type FieldType = 'term' | 'range' | 'text';
export type LogicalConnect = 'AND' | 'OR';

export interface FieldConfig {
	type: FieldType;
	// Name of the field in OpenSearch index
	indexField: string;
	logicalConnect?: LogicalConnect;
	resolve?: (values: string[]) => Promise<string[]>;
	// Allow to pass values encoded, e.g. encode spaces
	decodeValues?: (value: any) => any;
}

export interface EntityConfig {
	fields: Record<string, FieldConfig>;
	traditionalSearch: {
		fields: string[];
	};
	vectorSearch?: {
		embeddingField: string;
		toEmbedding: (text: string) => Promise<number[]>;
		// number of neighbors (for top-K).
		k?: number;
		// radial search: include all points within this squared-distance
		maxDistance?: number;
		// similarity search: include all points with score ≥ this threshold
		minScore?: number;
	};
	// Filters that must be set in each query. This can be used e.g. to enforce a tenant filter
	requiredFilters?: Record<string, string>;
}

export function isVectorQuery(
	query: OpenSearchQuery,
): query is OpenSearchVectorQuery {
	return (query as OpenSearchVectorQuery).knn !== undefined;
}
