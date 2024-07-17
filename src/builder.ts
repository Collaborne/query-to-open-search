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
		if (freeText && freeText.length > 0) {
			if (this.entityConfig.vectorSearch && !quoted) {
				const inputEmbedding = await this.entityConfig.vectorSearch.toEmbedding(
					freeText,
				);
				query = {
					knn: {
						[this.entityConfig.vectorSearch.embeddingField]: {
							vector: inputEmbedding,
							k: 100,
							filter: {
								bool: query.bool,
							},
						},
					},
				};
			} else {
				const filters = this.entityConfig.traditionalSearch.fields.map(
					field => ({
						// Exact matching
						match_phrase: {
							[field]: freeText,
						},
					}),
				);
				query.bool.must.push({
					bool: {
						should: filters,
						minimum_should_match: 1, // At least one of the match queries must return true
					},
				});
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
