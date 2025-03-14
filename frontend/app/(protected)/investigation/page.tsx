"use client";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'

export default function Page() {
    const searchParams = useSearchParams();
    const search = searchParams.get('input')

    console.log(search);
    return (
        <div>
            { /* TODO: Show details passed from link here */ }
            <h1>Investigation Detail for </h1>

            <Link href={"/investigations"}>
            <Button>
                Back to Investigations
            </Button>
            </Link>
        </div>
    )
}