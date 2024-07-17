import { Filters } from '..';
import { FieldConfig } from '../../types';

const resolveTagGroups = async (values: string[]): Promise<string[]> => {
	const tagGroups: Record<string, string[]> = {
		competitors: ['coke', 'fanta', 'pepsi'],
	};

	return tagGroups[values[0]] || [];
};

describe('Filters', () => {
	let filters: Filters;

	beforeEach(() => {
		filters = new Filters();
	});

	test('adds AND term filters by default', async () => {
		const fieldConfig: FieldConfig = {
			type: 'term',
			indexField: 'tags',
			logicalConnect: 'AND',
		};
		const filterResults = await filters.create(fieldConfig, ['pain']);
		expect(filterResults).toContainEqual({ term: { tags: 'pain' } });
	});

	test('adds OR term filters when specified', async () => {
		const fieldConfig: FieldConfig = {
			type: 'term',
			indexField: 'tags',
		};
		const filterResults = await filters.create(fieldConfig, ['pain', 'gain']);
		expect(filterResults).toContainEqual({
			bool: {
				should: [{ term: { tags: 'pain' } }, { term: { tags: 'gain' } }],
				minimum_should_match: 1,
			},
		});
	});

	test('resolves and adds term filters', async () => {
		const fieldConfig: FieldConfig = {
			type: 'term',
			indexField: 'tag_ids',
			logicalConnect: 'AND',
			resolve: resolveTagGroups,
		};
		const filterResults = await filters.create(fieldConfig, ['competitors']);
		expect(filterResults).toEqual([
			{ term: { tag_ids: 'coke' } },
			{ term: { tag_ids: 'fanta' } },
			{ term: { tag_ids: 'pepsi' } },
		]);
	});
});
