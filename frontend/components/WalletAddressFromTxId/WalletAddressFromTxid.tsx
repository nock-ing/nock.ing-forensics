import {WalletAddressFromTxId} from "@/components/WalletAddressFromTxId/walletAddressFromTxId.types";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";
import {Badge} from "@/components/ui/badge";


export default function WalletAddressFromTxid({txid, scriptpubkey_address}: WalletAddressFromTxId) {
    return (
        <HoverCard>
            <HoverCardTrigger><Badge>{scriptpubkey_address}</Badge></HoverCardTrigger>
            <HoverCardContent className={"w-200"}>
                Transaction ID: {txid}
            </HoverCardContent>
        </HoverCard>
    );
}