import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { create } from "ipfs-core";
import { PDFDocument } from "pdf-lib";
import z from "zod";

import { cidSchema } from "@/schemas";
import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { decrypt } from "@/utils/aes";
import { apiHandler } from "@/utils/api-route";

const NoteIdSchema = z.object({
    id: cidSchema,
});

const downloadNote: NextApiHandler = async (request, response) => {
    const action = request.query.action;

    if (!isValidAction(action)) {
        return response.status(422).send({
            message: "Not valid action.",
        });
    }

    const { id: noteId } = NoteIdSchema.parse(request.query);

    await ActionHandlers[action](response, request, noteId);
};

export default apiHandler({
    GET: downloadNote,
});

const Actions = ["preview", "download"] as const;
type Action = typeof Actions[number];
type ActionHandler = (response: NextApiResponse, request: NextApiRequest, noteId: string) => Promise<void | NextApiResponse<unknown>>;

const downloadPdf: ActionHandler = async (response, request, noteId) => {
    const session = await getServerAuthSession({
        req: request,
        res: response,
    });

    
    if (!session) {
        return response.status(401).end();
    }

    const isOwnedNote = await isOwned(session.user.id, noteId);

    if (!isOwnedNote) {
        return response.status(401).end();
    }

    const data = await downloadFileFromIPFS(noteId);
    
    const file = decryptFile(data);

    return response.status(200).send(file);
};

const previewPdf: ActionHandler = async (response, request, noteId) => {
    const data = await downloadFileFromIPFS(noteId);
    
    const file = decryptFile(data);

    const pdf = await PDFDocument.load(file);
    const numberOfPages = pdf.getPages().length;

    let numberOfPreviewPages = 0;

    if (numberOfPages / 3 < 2) {
        numberOfPreviewPages = Math.round(numberOfPages / 3);
    } else {
        numberOfPreviewPages = 3;
    }

    const previewPdf = await PDFDocument.create();
    const pageNumbers = Array.from({ length: numberOfPreviewPages }, (_, index) => index);
    const pages = await previewPdf.copyPages(pdf, pageNumbers);

    for (const page of pages) {
        previewPdf.addPage(page);
    }

    previewPdf.addPage();

    const previewFile = await previewPdf.save();

    response.status(200).send(Buffer.from(previewFile.buffer));
};

const ActionHandlers: Record<Action, ActionHandler> ={
    download: downloadPdf,
    preview: previewPdf,
}

const isValidAction = (action: unknown): action is Action => {
    if (typeof action !== "string") {
        return false;
    }

    return Actions.some((validAction) => validAction === action);
};

const isOwned = async (userId: string, noteId: string) => {
    const note = await prisma.note.findFirst({
        where: {
            id: noteId,
            OR: [
                {
                    authorId: userId,
                },
                {
                    buyers: {
                        some: {
                            userId,
                        }
                    }
                }
            ]
        }
    });

    return note !== null;
};

const downloadFileFromIPFS = async (cid: string) => {
    const node = await create();
    
    const stream = node.cat(cid);
    const decoder = new TextDecoder();
    let data = "";
    
    for await (const chunk of stream) {
        data += decoder.decode(chunk, { stream: true });
    }

    await node.stop();

    return data;
};

const decryptFile = (data: string) => {
    const splittedData = data.split(":") as [string, string, string];

    const iv = Buffer.from(splittedData[0], "hex");

    const key = decrypt(splittedData[1]).toString("hex");

    const file = decrypt(splittedData[2], key, iv);

    return file;
};