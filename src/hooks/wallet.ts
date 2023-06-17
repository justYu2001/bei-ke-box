import { useAccount, useConnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

export const useConnectWallet = () => {
    const { isDisconnected, isConnected, isConnecting, address } = useAccount();

    const connector = new MetaMaskConnector();
    const { connectAsync } = useConnect({ connector });

    const connectWallet = async () => {
        if (isDisconnected) {
            const result = await connectAsync();
            return result.account;
        }

        return address;
    }

    return {
        connector,
        isConnecting,
        isConnected,
        connectWallet,
    };
};