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
});

const getStudentIdByEmail = (email: string) => {
    const ntutGmailPattern = /^t([A-Z0-9]{9})@ntut\.org\.tw$/;
    const result = email.match(ntutGmailPattern);

    if (result) {
        return result[1];
    }
};