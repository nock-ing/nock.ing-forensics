'use client';

import AccountDetails from "@/components/AccountDetails/AccountDetails";
import {useUser} from "@/hooks/use-user";

export default function Page() {
    const { user, loading, error, signOut } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return <div>No user data available</div>;
    }

    return (
        <AccountDetails user={user} signOut={signOut} />
    );
}

