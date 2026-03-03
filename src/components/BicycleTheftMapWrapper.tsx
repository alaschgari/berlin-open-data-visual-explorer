'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const BicycleTheftMap = dynamic(() => import('./BicycleTheftMap'), {
    ssr: false,
    loading: () => <MapSkeleton />
});

export default function BicycleTheftMapWrapper({ district }: { district?: string }) {
    return <BicycleTheftMap district={district} />;
}
