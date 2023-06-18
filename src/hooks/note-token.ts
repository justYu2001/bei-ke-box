import { parseEther } from "ethers";
import { useContractWrite, useWaitForTransaction } from "wagmi";
import type { UseContractWriteConfig } from "wagmi";

import { env } from "@/env.mjs";

type Abi = UseContractWriteConfig["abi"];

const beikeboxAbi: Abi = [
    {
        name: "purchase",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "id", type: "uint256" }],
        outputs: [],
    },
    {
        name: "TransferSingle",
        type: "event",
        inputs: [
            {
                indexed: true,
                name: "operator",
                type: "address",
            },
            {
                indexed: true,
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                name: "to",
                type: "address",
            },
            {
                indexed: true,
                name: "id",
                type: "uint256",
            },
            {
                indexed: true,
                name: "value",
                type: "uint256",
            },
        ],
    },
];

interface BuyNoteHookConfig {
    onSuccess?: UseContractWriteConfig["onSuccess"];
}

export const useBuyNoteToken = ({ onSuccess }: BuyNoteHookConfig) => {
    const { writeAsync, ...rest } = useAbi({
        address: env.NEXT_PUBLIC_BEKEIBOX_ADDRESS as `0x{string}`,
        abi: beikeboxAbi,
        functionName: "purchase",
        onSuccess,
    });

    const buyNoteToken = (id: number | bigint, price: number | bigint) => {
        return writeAsync({
            args: [BigInt(id)],
            value: parseEther(price.toString()),
        });
    };

    return {
        ...rest,
        buyNoteToken,
    };
};

const useAbi = (config: UseContractWriteConfig) => {
    const {
        data: result,
        error,
        isError,
        writeAsync,
    } = useContractWrite(config);

    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: result?.hash,
    });

    return {
        isError,
        error,
        writeAsync,
        isLoading,
        isSuccess,
    };
};
