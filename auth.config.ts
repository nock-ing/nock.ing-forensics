import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth"

import { LoginSchema } from "@/schemas";
import {getUserByEmail} from "@/data/user";
import bcrypt from "bcryptjs";

export default { providers: [
        Credentials({
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials);

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data;

                    const user = await getUserByEmail(email);
                    // No password because if you use OAuth you don't have a password
                    if (!user || !user) return null;


                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) return user;
                }

                return null;
            }
        })
    ] } satisfies NextAuthConfig