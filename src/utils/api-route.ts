import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const HttpMethods = [
    "GET",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "POST",
    "PUT",
    "PATCH",
    "PURGE",
    "LINK",
    "UNLINK",
] as const;
    
type HttpMethod = Uppercase<typeof HttpMethods[number]>;

type ApiHandlers = {
    [key in HttpMethod]?: NextApiHandler;
}

export const apiHandler = (handlers: ApiHandlers) => {
    return (request: NextApiRequest, response: NextApiResponse) => {
        const method = request.method?.toUpperCase() as HttpMethod;
        const handler = handlers[method];

        if (!method || !handler) {
            return response.status(405).send({
                message: "Method Not Allowed.",
            });
        }

        try {
            handler(request, response);
        } catch (error) {
            console.error(error);

            response.status(500).send({
                message: "Unknown Error.",
            });
        }
    };
};