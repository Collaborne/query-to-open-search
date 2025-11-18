import { QueryToOpenSearchBuilder } from '../builder';
import {
	EntityConfig,
	OpenSearchFilters,
	OpenSearchHybridQuery,
	OpenSearchVectorQuery,
} from '../types';

const CONFIG: EntityConfig = {
	fields: {
		tag: { type: 'term', indexField: 'tags', logicalConnect: 'AND' },
		title: { type: 'text', indexField: 'title' },
		description: { type: 'text', indexField: 'description' },
	},
	traditionalSearch: {
		fields: ['title', 'description'],
	},
};

describe('QueryToOpenSearchBuilder vector search', () => {
	test('uses vector search', async () => {
		const embedding = [0, 1];
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			vectorSearch: {
				embeddingField: 'embeddingField',
				toEmbedding: async () => embedding,
			},
		});

		const queryString = `text tag:pain`;
		const query = (await translator.build(queryString))
			.query as OpenSearchVectorQuery;

		expect(query.knn.embeddingField.vector).toEqual(embedding);
		expect(query.knn.embeddingField.filter).toBeDefined();
		expect(query.knn.embeddingField.filter!.bool.must).toEqual([
			{
				term: { tags: 'pain' },
			},
		]);
	});

	test('respects forced exact search', async () => {
		const embedding = [0, 1];
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			vectorSearch: {
				embeddingField: 'embeddingField',
				toEmbedding: async () => embedding,
			},
		});

		const queryString = `"text" tag:pain`;
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
		expect(query.bool.must).toContainEqual({ term: { tags: 'pain' } });
	});

	test('skips vector search for empty queries', async () => {
		const toEmbedding = jest.fn().mockResolvedValue([0.1, 0.2]);
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			vectorSearch: {
				embeddingField: 'embeddingField',
				toEmbedding,
			},
		});

		const queryString = ``;
		const query = (await translator.build(queryString))
			.query as OpenSearchFilters;

		expect(query.bool.must).toEqual([]);
		expect(toEmbedding).not.toHaveBeenCalled();
	});

	test('uses radial vector search with maxDistance', async () => {
		const embedding = [0.5, 0.5];
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			vectorSearch: {
				embeddingField: 'embeddingField',
				toEmbedding: async () => embedding,
				maxDistance: 0.75,
			},
		});

		const queryString = `text tag:interview`;
		const query = (await translator.build(queryString))
			.query as OpenSearchVectorQuery;

		expect(query.knn.embeddingField.vector).toEqual(embedding);
		expect(query.knn.embeddingField.max_distance).toBe(0.75);
		expect(query.knn.embeddingField.k).toBeUndefined();
		expect(query.knn.embeddingField.min_score).toBeUndefined();
		expect(query.knn.embeddingField.filter).toBeDefined();
		expect(query.knn.embeddingField.filter!.bool.must).toContainEqual({
			term: { tags: 'interview' },
		});
	});

	test('uses radial vector search with minScore', async () => {
		const embedding = [0.3, 0.9];
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			vectorSearch: {
				embeddingField: 'embeddingField',
				toEmbedding: async () => embedding,
				minScore: 0.6,
			},
		});

		const queryString = `text tag:interview`;
		const query = (await translator.build(queryString))
			.query as OpenSearchVectorQuery;

		expect(query.knn.embeddingField.vector).toEqual(embedding);
		expect(query.knn.embeddingField.min_score).toBe(0.6);
		expect(query.knn.embeddingField.k).toBeUndefined();
		expect(query.knn.embeddingField.max_distance).toBeUndefined();
		expect(query.knn.embeddingField.filter).toBeDefined();
		expect(query.knn.embeddingField.filter!.bool.must).toContainEqual({
			term: { tags: 'interview' },
		});
	});

	test('combines vector and keyword search via hybrid mode', async () => {
		const embedding = [0.2, 0.8];
		const translator = new QueryToOpenSearchBuilder({
			...CONFIG,
			vectorSearch: {
				embeddingField: 'embeddingField',
				toEmbedding: async () => embedding,
				mode: 'hybrid',
			},
		});
		const queryString = `text tag:pain`;
		const query = (await translator.build(queryString))
			.query as OpenSearchHybridQuery;
		const [vectorQuery, keywordQuery] = query.hybrid.queries;
		expect(
			(vectorQuery as OpenSearchVectorQuery).knn.embeddingField.vector,
		).toEqual(embedding);
		expect(
			(vectorQuery as OpenSearchVectorQuery).knn.embeddingField.filter?.bool
				.must,
		).toContainEqual({ term: { tags: 'pain' } });
		expect((keywordQuery as OpenSearchFilters).bool.must).toContainEqual({
			bool: {
				minimum_should_match: 1,
				should: [
					{ match_phrase: { title: 'text' } },
					{ match_phrase: { description: 'text' } },
				],
			},
		});
		expect((keywordQuery as OpenSearchFilters).bool.must).toContainEqual({
			term: { tags: 'pain' },
		});
	});
});
