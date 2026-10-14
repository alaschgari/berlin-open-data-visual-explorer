'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const EducationMapClient = dynamic(() => import('./EducationMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function EducationMapWrapper() {
    return <EducationMapClient />;
}
