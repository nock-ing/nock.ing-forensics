import { db } from "@/src";

import { eq } from 'drizzle-orm';
import { users } from '@/src/db/schema';

export const getUserByEmail = async (email: string) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
};

export const getUserById = async (id: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
};