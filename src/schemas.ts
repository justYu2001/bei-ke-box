import { z } from "zod";

export const ethereumWalletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
