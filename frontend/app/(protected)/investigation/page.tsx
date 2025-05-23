'use client';
import {useSearchParams} from 'next/navigation';
import {RelatedTxReactFlow} from "@/components/RelatedTxReactFlow";

export default function Page() {
    const searchParams = useSearchParams();
    const search = searchParams.get('txid');

    return (
        <div className="h-screen">
            <RelatedTxReactFlow transactionId={search} zoomFactor={0.6}/>
        </div>
    );
}