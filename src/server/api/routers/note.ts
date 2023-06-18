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
});
