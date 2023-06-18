import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import { IoMdArrowForward } from "react-icons/io";

import StudyingImage from "public/images/studying.png";

const Home: NextPage = () => {
    return (
        <>
            <Head>
                <title>北科盒子</title>
                <meta name="description" content="北科盒子" />
            </Head>

            <main className="absolute inset-x-0 bottom-0 top-14 flex">
                <div className="flex h-full w-1/2 items-center justify-end">
                    <Image
                        src={StudyingImage}
                        alt=""
                        priority
                        className="w-11/12"
                    />
                </div>
                <div className="relative flex flex-1 flex-col justify-center pl-10 text-6xl font-medium leading-[1.4] tracking-wide">
                    <p>
                        分享你的<span className="text-amber-400">筆記</span>
                    </p>
                    <p>
                        讓學習創造<span className="text-amber-400">價值</span>
                    </p>
                    <Link
                        href="/note/upload"
                        className="group mt-4 flex w-40 items-center justify-between rounded-full bg-amber-400 px-4 py-3 text-left text-base font-medium tracking-wide text-white focus:bg-amber-400/70"
                    >
                        立即開始
                        <IoMdArrowForward className="text-2xl transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                </div>
            </main>
        </>
    );
};

export default Home;
