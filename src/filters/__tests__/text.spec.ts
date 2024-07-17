import { FieldConfig } from '../../types';
import { TextFilter } from '../text';

describe('TextFilter', () => {
	test('adds text filters', async () => {
		const fieldConfig: FieldConfig = { type: 'text', indexField: 'title' };
		const actual = await new TextFilter().create(fieldConfig, [
			'Feature request',
		]);
		expect(actual).toEqual([
			{
				match: { title: 'Feature request' },
			},
		]);
	});
});
