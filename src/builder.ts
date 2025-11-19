import {
	parse,
	SearchParserOptions,
	SearchParserResult,
} from 'search-query-parser';

import { Filters } from './filters';
import { getQuotedTexts } from './libs/quoted-text';
import {
	BuildResponse,
	EntityConfig,
	OpenSearchQuery,
	QueryBuilder,
} from './types';

const OPTIONS: SearchParserOptions = {
	offsets: false,
	alwaysArray: true,
};

function parseQueryString(queryString: string, entityConfig: EntityConfig) {
	const keywords = Object.entries(entityConfig.fields)
		.filter(([, config]) => config.type !== 'range')
		.map(([key]) => key);
	const ranges = Object.entries(entityConfig.fields)
		.filter(([, config]) => config.type === 'range')
		.map(([key]) => key);

	return parse(queryString, {
		...OPTIONS,
		keywords,
		ranges,
	});
}

function getFreeText(
	queryString: string,
	parsedQuery: string | SearchParserResult,
): { freeText: string | undefined; quoted: boolean } {
	const quotedText = getQuotedTexts(queryString);
	if (quotedText && quotedText.length > 0) {
		return { freeText: quotedText.join(' '), quoted: true };
	}

	if (typeof parsedQuery === 'string') {
		return { freeText: parsedQuery, quoted: false };
	}

	const parsedTexts = parsedQuery.text;
	const freeText = Array.isArray(parsedTexts) ? parsedTexts[0] : parsedTexts;
	return { freeText, quoted: false };
}

export class QueryToOpenSearchBuilder implements QueryBuilder {
	private entityConfig: EntityConfig;
	private filterHandler = new Filters();

	constructor(entityConfig: EntityConfig) {
		this.entityConfig = entityConfig;
	}

	async build(queryString: string): Promise<BuildResponse> {
		const parsedQuery = parseQueryString(queryString, this.entityConfig);

		const requiredFilters = Object.entries(
			this.entityConfig.requiredFilters ?? {},
		).map(([filter, value]) => ({
			term: {
				[filter]: value,
			},
		}));

		let query: OpenSearchQuery = {
			bool: {
				must: requiredFilters,
				must_not: [],
			},
		};

		if (typeof parsedQuery !== 'string') {
			const includeFilters = await this.createFilters(parsedQuery);
			query.bool.must.push(...includeFilters);

			// Handle excluded fields (negation)
			const excludeFilters = await this.createFilters(parsedQuery.exclude);
			query.bool.must_not.push(...excludeFilters);
		}

		const { freeText, quoted } = getFreeText(queryString, parsedQuery);
		const hasFreeText =
			typeof freeText === 'string' && freeText.trim().length > 0;
		const vectorSearch = this.entityConfig.vectorSearch;
		const shouldUseVectorSearch =
			Boolean(vectorSearch) && !quoted && hasFreeText;
		const useHybridMode =
			shouldUseVectorSearch && vectorSearch?.mode === 'hybrid';
		let traditionalSearchQuery: Record<string, unknown> | undefined;

		if (hasFreeText && freeText) {
			const filters = this.entityConfig.traditionalSearch.fields.map(field => ({
				// Exact matching
				match_phrase: {
					[field]: freeText,
				},
			}));
			traditionalSearchQuery = {
				bool: {
					should: filters,
					minimum_should_match: 1, // At least one of the match queries must return true
				},
			};

			if (!shouldUseVectorSearch) {
				query.bool.must.push(traditionalSearchQuery);
			}
		}

		if (shouldUseVectorSearch && vectorSearch && freeText) {
			const inputEmbedding = await vectorSearch.toEmbedding(freeText ?? '');
			const vectorQuery = {
				knn: {
					[vectorSearch.embeddingField]: {
						vector: inputEmbedding,
						max_distance: vectorSearch.maxDistance,
						min_score: vectorSearch.minScore,
						k: vectorSearch.k,
						filter: {
							bool: query.bool,
						},
					},
				},
			};

			if (useHybridMode && traditionalSearchQuery) {
				query = {
					hybrid: {
						queries: [
							vectorQuery,
							{
								bool: {
									must: [...query.bool.must, traditionalSearchQuery],
									must_not: [...query.bool.must_not],
								},
							},
						],
					},
				};
			} else {
				query = vectorQuery;
			}
		}
		return {
			query,
			parsedQuery: typeof parsedQuery !== 'string' ? parsedQuery : undefined,
		};
	}

	private async createFilters(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		valueByField: { [key: string]: any } | undefined,
	) {
		if (!valueByField) {
			return [];
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const filters: Record<string, any>[] = [];
		for (const [key, values] of Object.entries(valueByField)) {
			const fieldConfig = this.entityConfig.fields[key];
			if (fieldConfig) {
				const decodedValues = fieldConfig.decodeValues?.(values) ?? values;
				const fieldFilters = await this.filterHandler.create(
					fieldConfig,
					decodedValues,
				);
				filters.push(...fieldFilters);
			}
		}
		return filters;
	}
}
