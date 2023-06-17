import { createCipheriv, createDecipheriv } from "crypto";
import type { BinaryLike } from "crypto";

import { env } from "@/env.mjs";

const ALGORITHM = "aes-256-ctr";
const ENCRYPTION_KEY = env.FILE_ENCRYPTION_KEY;

export const encrypt = (data: BinaryLike, encryptionKey?: string, iv?: Buffer) => {
    if (!iv) {
        iv = Buffer.from(env.FILE_IV, "hex");
    }

    if (!encryptionKey) {
        encryptionKey = ENCRYPTION_KEY;
    }

    const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);
    let encryptedData = cipher.update(data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    return encryptedData.toString("hex");
};

export const decrypt = (data: string, encryptionKey?: string, iv?: Buffer) => {
    if (!iv) {
        iv = Buffer.from(env.FILE_IV, "hex");
    }

    if (!encryptionKey) {
        encryptionKey = ENCRYPTION_KEY;
    }

    const encryptedData = Buffer.from(data, "hex");
    const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
    let decryptedData = decipher.update(encryptedData);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);
    return decryptedData;
}