import { User } from "@/components/SideBar/sidebar.types";
import {Button} from "@/components/ui/button";

interface AccountDetailsProps {
    user: User;
    signOut: () => Promise<void>;
}

export default function AccountDetails({ user, signOut }: AccountDetailsProps) {
    return (
        <div>
            <h1 className={"text-3xl my-4"}>Account Details</h1>
            <p>Username: {user.username}</p>
            <p className={"mb-4"}>Email: {user.email}</p>
            <Button onClick={signOut}>Sign Out</Button>
        </div>
    );
}

