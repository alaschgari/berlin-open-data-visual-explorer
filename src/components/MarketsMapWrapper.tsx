'use client';
import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const MarketsMapClient = dynamic(() => import('./MarketsMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function MarketsMapWrapper({ district }: { district?: string }) {
    return <MarketsMapClient district={district} />;
}
