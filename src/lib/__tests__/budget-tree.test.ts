import { describe, expect, it } from 'vitest';
import { buildBudgetTree, type BudgetRecord } from '../budget-tree';

const record = (overrides: Partial<BudgetRecord>): BudgetRecord => ({
    district: 'Mitte',
    chapter: '1200',
    title: 'Personal',
    title_code: '42201',
    budget: 100,
    ...overrides,
});

describe('buildBudgetTree', () => {
    it('sums budgets up through title, chapter, district and root', () => {
        const tree = buildBudgetTree([
            record({ budget: 100 }),
            record({ budget: 50 }),
            record({ title_code: '51101', title: 'Sachmittel', budget: 25 }),
            record({ district: 'Pankow', budget: 10 }),
        ]);

        expect(tree.value).toBe(185);
        const mitte = tree.children!.find(d => d.name === 'Mitte')!;
        expect(mitte.value).toBe(175);
        expect(mitte.children).toHaveLength(1);
        expect(mitte.children![0].children!.map(t => [t.name, t.value])).toEqual([
            ['42201 - Personal', 150],
            ['51101 - Sachmittel', 25],
        ]);
        expect(tree.children!.find(d => d.name === 'Pankow')!.value).toBe(10);
    });

    it('treats a null budget as zero', () => {
        expect(buildBudgetTree([record({ budget: null })]).value).toBe(0);
    });

    it('falls back to the title code when no title is stored', () => {
        const tree = buildBudgetTree([record({ title: null, title_code: 'UNKNOWN' })]);
        expect(tree.children![0].children![0].children![0].name).toBe('UNKNOWN - UNKNOWN');
    });
});
