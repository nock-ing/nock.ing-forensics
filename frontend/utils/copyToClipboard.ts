import { toast } from "@/hooks/use-toast";

export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            toast({
                title: "Success",
                description: "Copied to clipboard",
                variant: "default",
            });
        })
        .catch(err => {
            toast({
                title: "Error",
                description: "Failed to copy to clipboard",
                variant: "destructive",
            });
            console.error('Failed to copy: ', err);
        });
};