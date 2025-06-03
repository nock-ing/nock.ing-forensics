import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {openAPI, username} from "better-auth/plugins";
import * as authSchema from "./db/auth-schema";
import db from "./db";

const providers = [
    "github",
];

export const configuredProviders = providers.reduce<
    Record<
        string,
        {
            clientId: string;
            clientSecret: string;
            appBundleIdentifier?: string;
            tenantId?: string;
            requireSelectAccount?: boolean;
            clientKey?: string;
            issuer?: string;
        }
    >
>((acc, provider) => {
    const id = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const secret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    if (id && id.length > 0 && secret && secret.length > 0) {
        acc[provider] = { clientId: id, clientSecret: secret };
    }
    return acc;
}, {});

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8558",
    secret: process.env.BETTER_AUTH_SECRET || undefined,
    socialProviders: configuredProviders,
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 8,
    },
    plugins: [openAPI(), username()],
    trustedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
    }),
});