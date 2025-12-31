import { QueryToOpenSearchBuilder } from '../builder';
import { EntityConfig, OpenSearchFilters } from '../types';
const resolveTagGroups = async (values: string[]): Promise<string[]> => {
	const tagGroups: Record<string, string[]> = {
		competitors: ['coke', 'pepsi'],
	};
	return tagGroups[values[0]] || [];
};
const CONFIG: EntityConfig = {
	fields: {
		tag: { type: 'term', indexField: 'tags', logicalConnect: 'AND' },
		date: { type: 'range', indexField: 'createdAt' },
		author: { type: 'term', indexField: 'author' },
		title: { type: 'text', indexField: 'title' },
		description: { type: 'text', indexField: 'description' },
		tag_groups: {
			type: 'term',
			indexField: 'tag_ids',
			resolve: resolveTagGroups,
		},
	},
	traditionalSearch: {
		fields: ['title', 'description'],
	},
};

describe('SearchQueryToOpenSearchFilterTranslator', () => {
	test('handles multiple filter types', async () => {
		const translator = new QueryToOpenSearchBuilder(CONFIG);

		const from = new Date('2013-09-06T00:00:00.000Z');
		const to = new Date('2023-10-15T00:00:00.000Z');
		const dateQueryString = `date:${from.getTime()}-${to.getTime()}`;
		const queryString = `text tag:pain tag:interview -tag:negative ${dateQueryString} title:"Feature request" tag_groups:competitors`;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		// Text filters
		expect(query.bool.must).toContainEqual({
			bool: {
				minimum_should_match: 1,
				should: [
					{ match_phrase: { title: 'text' } },
					{ match_phrase: { description: 'text' } },
				],
			},
		});
		expect(query.bool.must).toContainEqual({
			match: { title: 'Feature request' },
		});

		// Term filters
		expect(query.bool.must).toContainEqual({
			term: { tags: 'pain' },
		});
		expect(query.bool.must).toContainEqual({
			term: { tags: 'interview' },
		});

		// Range filter
		expect(query.bool.must).toContainEqual({
			range: {
				createdAt: {
					gte: from.toISOString(),
					lte: to.toISOString(),
				},
			},
		});

		// Text filter
		expect(query.bool.must).toContainEqual({
			match: { title: 'Feature request' },
		});

		// Negation
		expect(query.bool.must_not).toContainEqual({
			term: { tags: 'negative' },
		});

		// Group filter
		expect(query.bool.must).toContainEqual({
			bool: {
				minimum_should_match: 1,
				should: [{ term: { tag_ids: 'coke' } }, { term: { tag_ids: 'pepsi' } }],
			},
		});
	});

	test('handles range filters using underscore-separated dates', async () => {
		const translator = new QueryToOpenSearchBuilder(CONFIG);

		const queryString =
			'date:2023_09_06T00:00:00.000Z-2023_10_15T00:00:00.000Z';
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toContainEqual({
			range: {
				createdAt: {
					gte: '2023-09-06T00:00:00.000Z',
					lte: '2023-10-15T00:00:00.000Z',
				},
			},
		});
	});

	test('handles filters without free-text search', async () => {
		const translator = new QueryToOpenSearchBuilder(CONFIG);

		const queryString = `tag:pain`;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toEqual([{ term: { tags: 'pain' } }]);
	});

	test('handles only freetext search', async () => {
		const translator = new QueryToOpenSearchBuilder(CONFIG);

		const queryString = `text`;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toContainEqual({
			bool: {
				minimum_should_match: 1,
				should: [
					{ match_phrase: { title: 'text' } },
					{ match_phrase: { description: 'text' } },
				],
			},
		});
	});

	test('adds required filters', async () => {
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			requiredFilters: {
				tenant: 'my-tenant',
				user: 'my-user',
			},
		});

		const queryString = `text`;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toContainEqual({ term: { tenant: 'my-tenant' } });
		expect(query.bool.must).toContainEqual({ term: { user: 'my-user' } });
	});

	test('decodes values for filters', async () => {
		const translator = new QueryToOpenSearchBuilder({
			fields: {
				tag: {
					type: 'term',
					indexField: 'tag',
					decodeValues: values => values.map((v: unknown) => `decoded/${v}`),
				},
			},
			traditionalSearch: { fields: [] },
		});

		const queryString = `tag:value`;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toContainEqual({ term: { tag: 'decoded/value' } });
	});

	test('handles empty search', async () => {
		const translator = new QueryToOpenSearchBuilder(CONFIG);

		const queryString = ``;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toEqual([]);
	});
});
