import type { AppType } from "next/app";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { pdfjs } from "react-pdf";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { hardhat, mainnet } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { publicProvider } from "wagmi/providers/public";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const { chains, publicClient } = configureChains(
    [mainnet, hardhat],
    [publicProvider()]
);

const config = createConfig({
    autoConnect: true,
    connectors: [new MetaMaskConnector({ chains })],
    publicClient,
});

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    return (
        <WagmiConfig config={config}>
            <SessionProvider session={session} refetchInterval={0}>
                <Component {...pageProps} />
            </SessionProvider>
        </WagmiConfig>
    );
};

export default api.withTRPC(MyApp);
