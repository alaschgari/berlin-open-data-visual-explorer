import { getTitleName } from './budget-mappings';

export interface TreeNode {
    name: string;
    value: number;
    children?: TreeNode[];
}

/** The subset of a financial_records row needed to build the tree. */
export interface BudgetRecord {
    district: string;
    chapter: string;
    title: string | null;
    title_code: string;
    budget: number | null;
}

export function buildBudgetTree(records: BudgetRecord[]): TreeNode {
    const root: TreeNode = {
        name: 'Gesamthaushalt Berlin',
        value: 0,
        children: []
    };

    const districtMap = new Map<string, TreeNode>();

    records.forEach(record => {
        // Find or create district node
        let districtNode = districtMap.get(record.district);
        if (!districtNode) {
            districtNode = { name: record.district, value: 0, children: [] };
            districtMap.set(record.district, districtNode);
            root.children!.push(districtNode);
        }

        // Find or create chapter node
        let chapterNode = districtNode.children!.find(c => c.name === record.chapter);
        if (!chapterNode) {
            chapterNode = { name: record.chapter, value: 0, children: [] };
            districtNode.children!.push(chapterNode);
        }

        // Add title as leaf
        const resolvedTitle = record.title || getTitleName(record.title_code);
        const titleName = `${record.title_code} - ${resolvedTitle}`;
        let titleNode = chapterNode.children!.find(t => t.name === titleName);
        if (!titleNode) {
            titleNode = { name: titleName, value: 0 };
            chapterNode.children!.push(titleNode);
        }

        // Update values
        const budget = record.budget ?? 0;
        titleNode.value += budget;
        chapterNode.value += budget;
        districtNode.value += budget;
        root.value += budget;
    });

    return root;
}
