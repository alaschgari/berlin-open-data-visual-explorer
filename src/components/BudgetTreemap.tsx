'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TreeNode {
    name: string;
    value: number;
    children?: TreeNode[];
}

interface BudgetTreemapProps {
    data: TreeNode | null;
    onDrillDown: (name: string) => void;
    isRoot: boolean;
}

export default function BudgetTreemap({ data, onDrillDown, isRoot }: BudgetTreemapProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // If node has no children, we treat it as a leaf but the explorer
        // will show it as the "selected" node in breadcrumbs.
        // For the treemap, we want to show its direct children.
        const plotData = data.children ? data : { ...data, children: [data] };

        const width = 800;
        const height = 500;

        // Clear previous
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('width', '100%')
            .style('height', '100%')
            .style('font-family', 'Inter, sans-serif');

        const root = d3.hierarchy<TreeNode>(plotData)
            .sum(d => d.value)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        d3.treemap<TreeNode>()
            .size([width, height])
            .paddingOuter(4)
            .paddingInner(8) // More padding for cleaner look
            .round(true)(root);

        const color = d3.scaleOrdinal()
            .range(['#14b8a6', '#8b5cf6', '#f59e0b', '#f43f5e', '#3b82f6', '#10b981', '#6366f1', '#ec4899']);

        // We only want to show the immediate children of the root passed in
        const nodes = (root.children || [root]) as d3.HierarchyRectangularNode<TreeNode>[];

        const leaf = svg.selectAll('g')
            .data(nodes)
            .join('g')
            .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

        leaf.append('rect')
            .attr('id', (d: any) => (d.leafId = `leaf-${Math.random().toString(36).substr(2, 9)}`))
            .attr('fill', (d: any) => color(d.data.name) as string)
            .attr('fill-opacity', 0.2) // Subtle background
            .attr('stroke', (d: any) => color(d.data.name) as string)
            .attr('stroke-width', 2)
            .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
            .attr('rx', 12)
            .attr('ry', 12)
            .style('cursor', (d: any) => d.data.children ? 'pointer' : 'default')
            .on('mouseover', function () {
                d3.select(this).attr('fill-opacity', 0.4).attr('stroke-width', 3);
            })
            .on('mouseout', function () {
                d3.select(this).attr('fill-opacity', 0.2).attr('stroke-width', 2);
            })
            .on('click', (event, d: any) => {
                if (d.data.children) {
                    onDrillDown(d.data.name);
                }
            });

        leaf.append('clipPath')
            .attr('id', (d: any) => (d.clipId = `clip-${Math.random().toString(36).substr(2, 9)}`))
            .append('use')
            .attr('xlink:href', (d: any) => `#${d.leafId}`);

        leaf.append('text')
            .attr('clip-path', (d: any) => `url(#${d.clipId})`)
            .attr('x', 15)
            .attr('y', 30)
            .attr('fill', 'white')
            .style('font-size', '14px')
            .style('font-weight', '700')
            .text((d: any) => d.data.name);

        leaf.append('text')
            .attr('clip-path', (d: any) => `url(#${d.clipId})`)
            .attr('x', 15)
            .attr('y', 55)
            .attr('fill', (d: any) => color(d.data.name) as string)
            .style('font-size', '18px')
            .style('font-weight', '800')
            .text((d: any) => `${(d.data.value / 1e6).toFixed(1)} Mio. €`);

        // Add a "view details" hint if has children
        leaf.filter((d: any) => !!d.data.children)
            .append('text')
            .attr('x', 15)
            .attr('y', (d: any) => (d.y1 - d.y0) - 20)
            .attr('fill', 'rgba(255,255,255,0.4)')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '0.05em')
            .text('→ Details ansehen');

    }, [data, onDrillDown]);

    return (
        <div className="w-full h-full bg-slate-950/20 rounded-lg overflow-hidden">
            <svg ref={svgRef}></svg>
        </div>
    );
}
