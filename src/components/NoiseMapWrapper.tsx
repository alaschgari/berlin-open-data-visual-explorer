'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const NoiseMapClient = dynamic(() => import('./NoiseMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function NoiseMapWrapper() {
    return <NoiseMapClient />;
}
