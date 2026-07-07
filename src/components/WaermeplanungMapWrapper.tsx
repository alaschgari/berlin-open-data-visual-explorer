'use client';
import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const WaermeplanungMapClient = dynamic(() => import('./WaermeplanungMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function WaermeplanungMapWrapper({ district }: { district?: string }) {
    return <WaermeplanungMapClient district={district} />;
}
