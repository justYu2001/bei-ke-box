import { z } from "zod";

import { cidSchema, ethereumWalletAddressSchema } from "@/schemas";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const accountsRouter = createTRPCRouter({
    fetchCourses: protectedProcedure
        .query(({ ctx: { session, prisma } }) => {
            const { user: { email } } = session;

            if (!email) {
                return null;
            }

            const studentId = getStudentIdByEmail(email);

            if (!studentId) {
                return null;
            }
            
            return prisma.course.findMany({
                where: {
                    students: {
                        some: {
                            studentId,
                        }
                    }
                },
                orderBy: [
                    {
                        year: "desc",
                    },
                    {
                        semester: "desc",
                    },
                ]
            });
        }),
    connectCryptoWallet : protectedProcedure
        .input(
            z.object({
                address: ethereumWalletAddressSchema,
                provider: z.string().nonempty(),
            })
        )
        .mutation(async ({ input: { address, provider }, ctx: { session, prisma } }) => {
            const account  = await prisma.account.findUnique({
                where: {
                    id: address,
                },
            });

            if (account) {
                return account;
            }
            
            return prisma.account.create({
                data: {
                    id: address,
                    user: {
                        connect: {
                            id: session.user.id,
                        },
                    },
                    type: "crypto wallet",
                    provider,
                    providerAccountId: address,
                },
            });
        }),
    isOwned: protectedProcedure
        .input(
            z.object({
                noteId: cidSchema.optional(),
            })
        )
        .query(async ({ input: { noteId }, ctx: { session, prisma } }) => {
            const note = await prisma.note.findFirst({
                where: {
                    id: noteId ?? "",
                    OR: [
                        {
                            authorId: session.user.id,
                        },
                        {
                            buyers: {
                                some: {
                                    userId: session.user.id,
                                }
                            }
                        }
                    ]
                }
            });

            return note !== null;
        }),
    buyNote: protectedProcedure
        .input(
            z.object({
                noteId: cidSchema,
            })
        )
        .mutation(({ input: { noteId }, ctx: { session, prisma } }) => {
            return prisma.usersPurchasedNotes.create({
                data: {
                    noteId,
                    userId: session.user.id,
                },
            });
        }),
});

const getStudentIdByEmail = (email: string) => {
    const ntutGmailPattern = /^t([A-Z0-9]{9})@ntut\.org\.tw$/;
    const result = email.match(ntutGmailPattern);

    if (result) {
        return result[1];
    }
};