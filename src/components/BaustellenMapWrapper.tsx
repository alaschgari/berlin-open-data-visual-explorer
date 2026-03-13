'use client';
import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const BaustellenMapClient = dynamic(() => import('./BaustellenMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function BaustellenMapWrapper({ district }: { district?: string }) {
    return <BaustellenMapClient district={district} />;
}
