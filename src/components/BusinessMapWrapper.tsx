
'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const BusinessMapClient = dynamic(() => import('./BusinessMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />
});

export default function BusinessMapWrapper({ district }: { district: string }) {
    return <BusinessMapClient district={district} />;
}
