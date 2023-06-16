import { useState, useEffect } from "react";

import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useRouter } from "next/router";

import { getCsrfToken, getProviders, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import { AiFillInfoCircle } from "react-icons/ai";
import { SiweMessage } from "siwe";
import { useAccount, useConnect, useNetwork, useSignMessage } from "wagmi";
import type { Connector } from "wagmi";

import { getServerAuthSession } from "@/server/auth";
import MetamaskLogo from "public/images/metamask.png";

const SignInPage = ({ providers }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    return (
        <main className="flex flex-col">
            <h1 className="mt-10 text-center text-6xl font-medium tracking-wide">
                歡迎回來<span className="text-amber-400">北科盒子</span>！
            </h1>

            <small className="my-4 text-center text-lg tracking-wide text-slate-400">
                請選擇以下一種方式登入
            </small>

            <div className="mt-32 flex flex-1 flex-col items-center gap-y-6">
                <SignInButtonGroup providers={Object.values(providers)} />
            </div>
        </main>
    );
};

export default SignInPage;

interface ServerSideProps {
    providers: Exclude<Awaited<ReturnType<typeof getProviders>>, null> | [];
}

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (context) => {
    const session = await getServerAuthSession(context);

    if (session) {
        return {
            props: {
                providers: [],
            },
            redirect: {
                destination: "/",
            },
        };
    }

    const providers = await getProviders();

    return {
        props: {
            providers: providers ?? [],
        },
    };
};

interface SignInButtonGroupProps {
    providers: ClientSafeProvider[];
}

const SignInButtonGroup = ({ providers }: SignInButtonGroupProps) => {
    const oauthProviders = providers.filter((provider) => provider.type === "oauth");

    return (
        <>
            {oauthProviders.map((provider) => (
                <OauthSignInButton key={provider.name} provider={provider} />
            ))}

            <EthereumSignInButtonGroup />
        </>
    );
};

interface OauthSignInButtonProps {
    provider: ClientSafeProvider;
}

const OauthSignInButton = ({ provider }: OauthSignInButtonProps) => {
    return (
        <SignInButton
            providerName={provider.name}
            onClick={() => void signIn(provider.id)}
        />
    );
};

const EthereumSignInButtonGroup = () => {
    const { connectors } = useConnect();

    const [metamaskInstalled, setMetamaskInstalled] = useState(false);

    const [availableConnectors, setAvailableConnectors] = useState<Connector[]>([]);

    /**
     * Due to we only can know MetaMask is installed or not in client side,
     * so we need to check it in `useEffect()` to prevent Next.js Hydration Error.
     * See https://nextjs.org/docs/messages/react-hydration-error
     */
    useEffect(() => {
        const newAvailableConnectors = connectors.filter((connector) => {
            if (connector.name === "MetaMask" && connector.ready) {
                setMetamaskInstalled(true);
            }

            return connector.ready;
        });

        setAvailableConnectors(newAvailableConnectors);
    }, [connectors]);

    return (
        <>
            {availableConnectors.map((connector) => (
                <EthereumSignInButton
                    key={connector.id}
                    connector={connector}
                />
            ))}

            {!metamaskInstalled && <MetamaskInstallationHint />}
        </>
    );
};

const MetamaskInstallationHint = () => {
    return (
        <div className="mt-2 flex items-center gap-x-1 text-slate-400">
            <AiFillInfoCircle className="text-xl" />
            <p>
                若要使用 MetaMask 帳戶登入，請先安裝{" "}
                <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline"
                >
                    MetaMask
                </a>
            </p>
        </div>
    );
};

interface EthereumSignInButtonProps {
    connector: Connector;
}

const EthereumSignInButton = ({ connector }: EthereumSignInButtonProps) => {
    const router = useRouter();

    const { chain } = useNetwork();

    const { address, isDisconnected } = useAccount();

    const { connectAsync } = useConnect();

    const { signMessageAsync } = useSignMessage();

    const signInWithEthereum = async () => {
        let walletAddress = address;
        let chainId = chain?.id;

        try {
            if (isDisconnected) {
                const result = await connectAsync({ connector });
                walletAddress = result.account;
                chainId = result.chain.id;
            }

            const message = new SiweMessage({
                domain: window.location.host,
                address: walletAddress,
                statement: "Sign in with Ethereum to Bei-Ke-Box",
                uri: window.location.origin,
                version: "1",
                chainId,
                nonce: await getCsrfToken(),
            });

            const signature = await signMessageAsync({
                message: message.prepareMessage(),
            });

            await signIn("credentials", {
                message: JSON.stringify(message),
                redirect: false,
                signature,
                provider: connector.name,
            });

            void router.push("/");
        } catch (error) {
            throw error;
        }
    };

    return (
        <SignInButton
            providerName={connector.name}
            onClick={() => void signInWithEthereum()}
        />
    );
};

interface SignInButtonProps {
    providerName: string;
    disabled?: boolean;
    onClick: () => void;
}

const SignInButton = ({ providerName, onClick }: SignInButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-x-3 rounded-lg border-2 border-slate-300 px-4 py-5 text-xl"
        >
            <Image
                src={Logos[providerName as Provider]}
                alt=""
                className="h-8 w-8"
            />

            <p className="w-60">使用 {providerName} 帳號登入</p>
        </button>
    );
};

const Providers = ["MetaMask"] as const;
type Provider = (typeof Providers)[number];

const Logos: Record<Provider, StaticImageData> = {
    MetaMask: MetamaskLogo,
};
