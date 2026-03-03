'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const BadestellenView = dynamic(() => import('./BadestellenView'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function BadestellenWrapper({ district }: { district?: string }) {
    return <BadestellenView district={district} />;
}
