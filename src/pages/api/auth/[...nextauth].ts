import type { NextApiHandler } from "next";

import NextAuth from "next-auth";

import { getAuthOptions } from "@/server/auth";

const auth: NextApiHandler = (request, response) => {
    const authOptions = getAuthOptions(request);
    return NextAuth(request, response, authOptions);
}

export default auth;
