'use client';
import dynamic from 'next/dynamic';
import { MapSkeleton } from './SkeletonCards';

const DisabledParkingMapClient = dynamic(() => import('./DisabledParkingMapClient'), {
    ssr: false,
    loading: () => <MapSkeleton />,
});

export default function DisabledParkingMapWrapper({ district }: { district?: string }) {
    return <DisabledParkingMapClient district={district} />;
}
