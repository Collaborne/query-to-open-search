import { FieldConfig } from '../../types';
import { TermFilter } from '../term';

const resolveTagGroups = async (values: string[]): Promise<string[]> => {
	const tagGroups: Record<string, string[]> = {
		competitors: ['coke', 'fanta', 'pepsi'],
	};

	return tagGroups[values[0]] || [];
};

describe('TermFilter', () => {
	test('adds term filters', async () => {
		const fieldConfig: FieldConfig = {
			type: 'term',
			indexField: 'tags',
		};
		const actual = await new TermFilter().create(fieldConfig, ['pain']);
		expect(actual).toEqual([{ term: { tags: 'pain' } }]);
	});

	test('resolves values for term filters', async () => {
		const fieldConfig: FieldConfig = {
			type: 'term',
			indexField: 'tag_ids',
			resolve: resolveTagGroups,
		};
		const actual = await new TermFilter().create(fieldConfig, ['competitors']);
		expect(actual).toEqual([
			{ term: { tag_ids: 'coke' } },
			{ term: { tag_ids: 'fanta' } },
			{ term: { tag_ids: 'pepsi' } },
		]);
	});
});
