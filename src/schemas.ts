import { z } from "zod";

export const ethereumWalletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const cidSchema = z.string().regex(/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})$/);