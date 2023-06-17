import type { GetServerSidePropsContext, NextApiRequest } from "next";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth";
import type { DefaultSession, DefaultUser, NextAuthOptions } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";

import { env } from "@/env.mjs";
import { ethereumWalletAddressSchema } from "@/schemas";
import { prisma } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            // ...other properties
            // role: UserRole;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        provider?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string;
        provider?: string;
    }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const getAuthOptions = (request: NextApiRequest | GetServerSidePropsContext["req"]): NextAuthOptions => {
    return {
        callbacks: {
            jwt: ({ token, user }) => {
                if (user) {
                    token.id = user.id;
                    token.provider = user.provider;
                }

                return token;
            },
            session: async ({ session, token }) => {
                const address = token.id;
                const walletProvider = token.provider;

                const parsedAddress = ethereumWalletAddressSchema.safeParse(address);
                const isCryptoWallet = parsedAddress.success && walletProvider;

                let userId = token.id;
                let username = session.user?.name;
                let email = session.user?.email;

                if (isCryptoWallet) {
                    const user = await getUserByWallet(parsedAddress.data, walletProvider);
                    userId = user.id;
                    username = user.name;
                    email = user.email;
                }

                return {
                    ...session,
                    user: {
                        ...session.user,
                        id: userId,
                        name: username,
                        email,
                    },
                };
            },
        },
        adapter: PrismaAdapter(prisma),
        providers: [
            GoogleProvider({
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            }),
            EthereumProvider(request),
            /**
             * ...add more providers here.
             *
             * Most other providers require a bit more work than the Discord provider. For example, the
             * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
             * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
             *
             * @see https://next-auth.js.org/providers/github
             */
        ],
        session: {
            strategy: "jwt",
        },
        pages: {
            signIn: "/signin",
        },
    };
};

const getUserByWallet = async (address: string, provider: string) => {
    let user = await getUserByWalletAddress(address);

    if (!user) {
        user = await createUserWithWallet(address, provider);
    }

    return user;
};

const getUserByWalletAddress = async (address: string) => {
    const account = await prisma.account.findUnique({
        where: {
            id: address,
        },
        include: {
            user: true,
        },
    });

    return account?.user;
};

const createUserWithWallet = async (address: string, provider: string) => {
    const newUser = await prisma.user.create({
        data: {
            name: undefined,
        },
    });

    await prisma.account.create({
        data: {
            id: address,
            user: {
                connect: {
                    id: newUser.id,
                },
            },
            type: "crypto wallet",
            provider: provider,
            providerAccountId: address,
        },
    });

    return newUser;
};

const EthereumProvider = (request: NextApiRequest | GetServerSidePropsContext["req"]) => {
    return CredentialsProvider({
        name: "Ethereum",
        credentials: {
            message: {
                label: "Message",
                type: "text",
                placeholder: "0x0",
            },
            signature: {
                label: "Signature",
                type: "text",
                placeholder: "0x0",
            },
            provider: {
                label: "Provider",
                type: "text",
            },
        },
        authorize: async (credentials) => {
            try {
                const message = JSON.parse(credentials?.message ?? "{}") as Partial<SiweMessage>;

                const siwe = new SiweMessage(message);

                const nextAuthUrl = new URL(env.NEXTAUTH_URL);

                const token = await getCsrfToken({ req: request });

                const result = await siwe.verify({
                    signature: credentials?.signature ?? "",
                    domain: nextAuthUrl.host,
                    nonce: token,
                });

                if (result.success) {
                    return {
                        id: siwe.address,
                        provider: credentials?.provider,
                    };
                }

                return null;
            } catch (error) {
                console.error(error);
                return null;
            }
        },
    });
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
    req: GetServerSidePropsContext["req"];
    res: GetServerSidePropsContext["res"];
}) => {
    const authOptions = getAuthOptions(ctx.req);
    return getServerSession(ctx.req, ctx.res, authOptions);
};
