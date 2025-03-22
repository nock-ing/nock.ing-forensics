import {WalletAddressFromTxId} from "@/components/WalletAddressFromTxId/walletAddressFromTxId.types";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";
import {Badge} from "@/components/ui/badge";
import Link from "next/link";


export default function WalletAddressFromTxid({txid, scriptpubkey_address}: WalletAddressFromTxId) {
    return (
        <HoverCard>
            <HoverCardTrigger><Link href={`/forensics?input=${scriptpubkey_address}&isTxid=false`}><Badge>{scriptpubkey_address}</Badge></Link></HoverCardTrigger>
            <HoverCardContent className={"w-200"}>
                Transaction ID: {txid}
            </HoverCardContent>
        </HoverCard>
    );
}