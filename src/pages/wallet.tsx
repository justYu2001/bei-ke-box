import type { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";

import { useConnectWallet } from "@/hooks/wallet";
import { api } from "@/utils/api";
import MetamaskLogo from "public/images/metamask.png";

const ReconnectWalletPage: NextPage = () => {
    const router = useRouter();

    const { connector, isConnecting, isConnected, connectWallet } = useConnectWallet();

    const { mutate } = api.accounts.connectCryptoWallet.useMutation();

    const handleButtonClick = async () => {
        const address = await connectWallet();
        mutate({ provider: "MetaMask", address: address as string });

        const url = router.query.redirectTo;

        if (typeof url === "string") {
            void router.push(url);
        } else {
            void router.push("/");
        }
    };

    return (
        <main className="flex flex-col items-center py-10 tracking-wide">
            <h1 className="mt-2 text-4xl font-medium">
                在進行以下操作前，請先連結錢包
            </h1>

            <Image src={MetamaskLogo} alt="" className="my-20 w-80" />

            <button
                disabled={!connector.ready || isConnecting || isConnected}
                onClick={() => void handleButtonClick()}
                className="rounded-md bg-amber-400 px-6 py-2 font-medium text-white disabled:bg-amber-400/70"
            >
                連結錢包
            </button>
        </main>
    );
};

export default ReconnectWalletPage;
