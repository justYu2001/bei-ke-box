import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

interface Year {
    year: number;
}

export const yearRouter = createTRPCRouter({
    fetchYears: publicProcedure
        .query(async ({ ctx: { prisma } }) => {
            const result = await prisma.$queryRaw<Year[]>`SELECT DISTINCT year from Course Order By year DESC`;
            return result.map(({ year }) => year);
        }),
});
