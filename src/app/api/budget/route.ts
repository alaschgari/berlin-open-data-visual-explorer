import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTitleName } from '@/lib/budget-mappings';

export const revalidate = 3600; // 1 hour

interface TreeNode {
    name: string;
    value: number;
    children?: TreeNode[];
}

function buildBudgetTree(records: any[]): TreeNode {
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
        titleNode.value += record.budget;
        chapterNode.value += record.budget;
        districtNode.value += record.budget;
        root.value += record.budget;
    });

    return root;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || '2024');

    try {
        // Step 1: Get total count for this year
        const { count, error: countError } = await supabase
            .from('financial_records')
            .select('*', { count: 'exact', head: true })
            .eq('year', year);

        if (countError) {
            console.error(`[API Budget] Count error for year ${year}:`, countError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        const totalRecords = count || 0;
        const CHUNK_SIZE = 1000;
        const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

        console.log(`[API Budget] Fetching ${totalRecords} records for ${year} in ${totalChunks} chunks`);

        // Step 2: Fetch all records in parallel chunks
        const fetchPromises = [];
        for (let i = 0; i < totalChunks; i++) {
            fetchPromises.push(
                supabase
                    .from('financial_records')
                    .select('*')
                    .eq('year', year)
                    .range(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE - 1)
            );
        }

        const chunkResults = await Promise.all(fetchPromises);
        let allRecords: any[] = [];

        chunkResults.forEach(({ data, error }, index) => {
            if (error) {
                console.error(`[API Budget] Error in chunk ${index}:`, error);
            } else if (data) {
                allRecords = allRecords.concat(data);
            }
        });

        if (allRecords.length === 0) {
            return NextResponse.json({ name: 'Keine Daten', value: 0, children: [] });
        }

        const tree = buildBudgetTree(allRecords);
        return NextResponse.json(tree);
    } catch (error) {
        console.error(`[API Budget] Error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
