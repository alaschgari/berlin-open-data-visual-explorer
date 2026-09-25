'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const AirQualityMapClient = dynamic(() => import('./AirQualityMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function AirQualityWrapper() {
    return <AirQualityMapClient />;
}
