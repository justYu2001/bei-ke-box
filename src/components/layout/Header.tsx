import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { signOut } from "next-auth/react";
import { BiLogOut } from "react-icons/bi";
import { HiDocument, HiDocumentPlus } from "react-icons/hi2";
import { IoWallet } from "react-icons/io5";
import { MdGridOn } from "react-icons/md";
import { useAccount, useDisconnect } from "wagmi";

import type { Account, User } from "@prisma/client";
import SearchBar from "@/components/filter/SearchBar";
import { api } from "@/utils/api";
import DefaultUserAvatar from "public/images/default-avatar.png";

const Header = () => {
    const [isOnPageTop, setIsOnPageTop] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const newScrollStatus = window.scrollY === 0;

            if (newScrollStatus !== isOnPageTop) {
                setIsOnPageTop(newScrollStatus);
            }
        };

        document.addEventListener("scroll", handleScroll);

        return () => document.removeEventListener("scroll", handleScroll);
    }, [isOnPageTop]);

    return (
        <header
            className={`sticky top-0 z-50 flex items-center justify-between border-b bg-white px-10 py-6 ${
                isOnPageTop ? "border-transparent" : "border-slate-300"
            }`}
        >
            <HeaderContent />
        </header>
    );
};

export default Header;

const HeaderContent = () => {
    const router = useRouter();

    const { data: user } = api.accounts.fetchAccount.useQuery(undefined, {
        staleTime: Infinity,
        retry: (failureCount, error) => {
            return error.message !== "UNAUTHORIZED";
        },
    });

    const searchNote = (keyword: string) => {
        void router.push(`/search?keyword=${keyword}`);
    };

    if (router.pathname === "/signin") {
        return <div className="h-10" />;
    }

    return (
        <>
            <Link href="/" className="text-3xl font-medium">
                北科盒子
            </Link>
            {!user && <SignInButton />}
            {user && <UserAvatar user={user} />}

            <div className="absolute inset-0 flex justify-center items-center -z-10">
                <SearchBar
                    width="w-3/5"
                    placeholder="輸入課號、筆記名稱、作者名稱、教授名稱或課名進行搜尋"
                    onChange={searchNote}
                />
            </div>
        </>
    );
};

interface UserAvatarProps {
    user: User & {
        accounts: Account[];
    };
}

const UserAvatar = ({ user }: UserAvatarProps) => {
    const { isDisconnected } = useAccount();

    const router = useRouter();

    const { disconnect } = useDisconnect();

    const handleSignOutButtonClick = () => {
        disconnect();
        void signOut({
            callbackUrl: "/",
        });
    };

    return (
        <div className="group relative h-10 w-10">
            <div className="absolute inset-0 cursor-pointer">
                <Image
                    src={user?.image ?? DefaultUserAvatar}
                    alt=""
                    fill
                    className="rounded-full"
                />
            </div>

            <div className="absolute right-0 top-9 hidden h-2 w-40 group-hover:block" />

            <ul className="pointer-events-none absolute right-0 top-11 z-50 w-48 rounded-md bg-white opacity-0 shadow-md transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                {isDisconnected && (
                    <Link
                        href={`/wallet?redirectTo=${router.asPath}`}
                        className="flex cursor-pointer items-center gap-x-1.5 p-3 hover:bg-slate-100"
                    >
                        <IoWallet className="text-lg" />
                        連結錢包
                    </Link>
                )}

                <Link
                    href="/account/purchased"
                    className="flex cursor-pointer items-center gap-x-1.5 p-3 hover:bg-slate-100"
                >
                    <HiDocument className="text-lg" />
                    已購買筆記
                </Link>

                <Link
                    href="/note/upload"
                    className="flex cursor-pointer items-center gap-x-1.5 p-3 hover:bg-slate-100"
                >
                    <HiDocumentPlus className="text-lg" />
                    上傳筆記
                </Link>

                <Link
                    href="/account/store"
                    className="flex cursor-pointer items-center gap-x-1.5 p-3 hover:bg-slate-100"
                >
                    <MdGridOn className="text-lg" />
                    我的商店
                </Link>

                <li
                    onClick={() => void handleSignOutButtonClick()}
                    className="flex cursor-pointer items-center gap-x-1.5 p-3 hover:bg-slate-100"
                >
                    <BiLogOut className="rotate-180 text-lg" />
                    登出
                </li>
            </ul>
        </div>
    );
};

const SignInButton = () => {
    return (
        <Link
            href="/signin"
            className="rounded-md border-2 border-slate-400 px-3 py-1 font-medium tracking-wide text-slate-400"
        >
            登入
        </Link>
    );
};
