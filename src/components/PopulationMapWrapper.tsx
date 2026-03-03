'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const PopulationMapClient = dynamic(() => import('./PopulationMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function PopulationMapWrapper({ district }: { district: string }) {
    return <PopulationMapClient district={district} />;
}
