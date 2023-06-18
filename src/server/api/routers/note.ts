import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

import { z } from "zod";

import { cidSchema } from "@/schemas";

export const noteRouter = createTRPCRouter({
    fetchNote: publicProcedure
        .input(
            z.object({
                id: cidSchema.optional(),
            })
        )
        .query(({ ctx: { prisma }, input: { id } }) => {
            return prisma.note.findUnique({
                where: {
                    id: id ?? "",
                },
                include: {
                    author: true,
                    course: true,
                }
            })
        }),
    fetchNotesByAuthorId: publicProcedure
        .input(
            z.object({
                authorId: z.string().cuid().optional(),
                keyword: z.string(),
                minPrice: z.number().min(0),
                maxPrice: z.number().max(1_000_000),
                year: z.number().min(0),
                semester: z.number().min(1).max(2),
            })
        )
        .query(({ input, ctx: { prisma, session } }) => {
            const {
                keyword,
                minPrice,
                maxPrice,
                year,
                semester,
            } = input;

            let authorId = input.authorId;

            if (!authorId && session) {
                authorId = session.user.id;
            }

            return prisma.note.findMany({
                where: {
                    authorId,
                    price: {
                        gte: minPrice,
                        lte: maxPrice,
                    },
                    course: {
                        year,
                        semester,
                    },
                    OR: [
                        {
                            name: {
                                contains: keyword,
                            },
                        },
                        {
                            courseId: {
                                contains: keyword,
                            },
                        },
                        {
                            course: {
                                name: {
                                    contains: keyword,
                                }
                            }
                        },
                        {
                            course: {
                                teachers: {
                                    some: {
                                        teacher: {
                                            name: {
                                                contains: keyword,
                                            },
                                        }
                                    }
                                }
                            }
                        },
                    ],
                },
                include: {
                    course: {
                        include: {
                            teachers: {
                                include: {
                                    teacher: true,
                                }
                            },
                        },
                    },
                    author: true,
                }
            });
        }),
});
