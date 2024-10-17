"use server";

import * as z from "zod";
import { db } from "@/src"; // Ensure this is your Drizzle ORM instance
import { RegisterSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import { users } from "@/src/db/schema"; // Import your users table schema
import { eq } from "drizzle-orm";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields!"
        };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if a user with the given email already exists
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existingUser.length > 0) {
        return {
            error: "Email or Password is wrong."
        };
    }

    // Insert the new user into the database
    await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
    });

    // TODO: Send verification token email

    return {
        success: "User created!"
    };
};
