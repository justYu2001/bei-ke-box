import { randomBytes } from "crypto";
import { Writable } from "stream";

import type { NextApiHandler, NextApiRequest, PageConfig } from "next";

import { ethers, parseEther } from "ethers";
import type { AddressLike, BigNumberish } from "ethers";
import formidable from "formidable";
import type { Fields, Files, Options as FormidableOptions } from "formidable";
import { create } from "ipfs-core";
import { z } from "zod";

import { env } from "@/env.mjs";
import { ethereumWalletAddressSchema } from "@/schemas";
import { getServerAuthSession } from "@/server/auth"; 
import { prisma } from "@/server/db";
import { encrypt } from "@/utils/aes";
import { apiHandler } from "@/utils/api-route";
import { BeiKeBox__factory } from "types/ethers-contracts/factories/BeiKeBox__factory";


const newNoteRequestBodySchema = z.object({
    name: z.string().min(1),
    authorAddress: ethereumWalletAddressSchema,
    courseId: z.string().min(1),
    price: z.string().transform((value) => Number.parseFloat(value)),
    description: z.string(),
});

export type NewNodeApiRequestBody = z.infer<typeof newNoteRequestBodySchema>;

type NewNote = Omit<NewNodeApiRequestBody, "authorAddress"> & {
    id: string;
    authorId: string;
    tokenId: bigint;
};

interface NewNoteApiErrorResponse {
    message: string;
}

export interface NewNoteApiSuccessResponse {
    id: string;
}

type NewNoteApiResponse = NewNoteApiErrorResponse | NewNoteApiSuccessResponse;

const addNote: NextApiHandler<NewNoteApiResponse> = async (request, response) => {
    const session = await getServerAuthSession({
        req: request,
        res: response,
    });

    if (!session) {
        return response.status(401).end();
    }

    const { fileData, fileExtension, body } = await parseRequest(request);

    if (fileExtension !== ".pdf" || !isPDF(fileData)) {
        return response.status(422).send({
            message: "Invalid file format. Only PDF files accepted.",
        });
    }

    const { authorAddress, ...newNote } = newNoteRequestBodySchema.parse(body);

    const { cid } = await uploadNote(fileData);

    const tokenId = await mintNoteToken(authorAddress, newNote.price);

    const { id } = await addNoteToDatabase({
        ...newNote,
        id: cid,
        authorId: session.user.id,
        tokenId,
    });

    return response.status(200).send({
        id,
    });
};

export default apiHandler({
    POST: addNote,
});

export const config: PageConfig = {
    api: {
        bodyParser: false,
    },
};

const parseRequest = async (request: NextApiRequest) => {
    const chunks: never[] = [];
    let fileExtension = "";

    const { fields } = await formdiablePromise(request, {
        ...formdiableConfig,
        fileWriteStreamHandler: () => fileConsumer(chunks),
        filename: (name, extension) => {
            fileExtension = extension;
            return `${name}.${extension}`;
        },
    });

    return {
        fileData: Buffer.concat(chunks),
        fileExtension,
        body: convertFormFieldsToBody(fields),
    };
};

const convertFormFieldsToBody = (fields: Fields) => {
    const body: Record<string, string> = {};

    for (const [key, values] of Object.entries(fields)) {
        body[key] = values[0] as string;
    }

    return body;
};

const formdiableConfig: FormidableOptions = {
    keepExtensions: true,
    maxFileSize: 10_000_000,
    maxFieldsSize: 10_000_000,
    maxFields: 6,
    allowEmptyFiles: false,
    multiples: false,
};

interface FormdiablePromise {
    (request: NextApiRequest, options?: FormidableOptions): Promise<{ fields: Fields; files: Files }>;
}

const formdiablePromise: FormdiablePromise = (request, options) => {
    return new Promise((resolve, reject) => {
        const form = formidable(options);

        form.parse(request, (error, fields, files) => {
            if (error) {
                return reject(error);
            }

            return resolve({fields, files});
        });
    });
};

const isPDF = (file: Buffer) => {
    const pdfHeader = ["%", "P", "D", "F"].map((character) => character.charCodeAt(0));

    return pdfHeader.every((header, index) => {
        return header === file[index];
    });
}

const fileConsumer = <T = unknown>(acc: T[]) => {
    return new Writable({
        write: (chunk, _enc, next) => {
            acc.push(chunk as T);
            next();
        },
    })
};

const uploadNote = async (fileData: Buffer) => {
    const node = await create();

    const encryptedData = encryptFile(fileData);

    const file = await node.add(encryptedData);
    await node.stop();

    return { cid: file.cid.toString() };
};

const encryptFile = (fileData: Buffer) => {
    const key = randomBytes(16);
    const iv = randomBytes(16);
    const encryptedFile = encrypt(fileData, key.toString("hex"), iv);
    const encryptedKey = encrypt(key);

    return `${iv.toString("hex")}:${encryptedKey}:${encryptedFile}`;
};

const mintNoteToken = async (producer: AddressLike, price: BigNumberish) => {
    const provider = new ethers.JsonRpcProvider(env.RPC_URL);

    const signer = await provider.getSigner(env.BeKeiBox_OWNER_ADDRESS);

    const contract = BeiKeBox__factory.connect(env.NEXT_PUBLIC_BEKEIBOX_ADDRESS, signer);

    const transaction = await contract.initializeToken(producer, 1e8, parseEther(price.toString()));
    await transaction.wait();

    const eventFilters = contract.filters.mintEvent();
    const mintEvents = await contract.queryFilter(eventFilters, "latest");
    
    const newTokenId = mintEvents[0]?.args[0] as bigint;
    
    return newTokenId;
}

const addNoteToDatabase = (note: NewNote) => {
    return prisma.note.create({
        data: {
            id: note.id,
            tokenId: note.tokenId,
            name: note.name,
            price: note.price,
            description: note.description,
            course: {
                connect: {
                    id: note.courseId,
                }
            },
            author: {
                connect: {
                    id: note.authorId,
                }
            }
        },
    });
};
