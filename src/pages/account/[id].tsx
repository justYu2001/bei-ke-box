import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";

import { useState } from "react";

import KeywordChip from "@/components/filter/KeywordChip";
import PriceChip from "@/components/filter/PriceChip";
import SearchBar from "@/components/filter/SearchBar";
import SemesterChip from "@/components/filter/SemesterChip";
import NoteCard from "@/components/note/NoteCard";
import { useFilters } from "@/hooks/filter";
import { prisma } from "@/server/db";
import { api } from "@/utils/api";

interface StorePageProps {
    username: string;
}

const StorePage: NextPage<StorePageProps> = ({ username }) => {
    const router = useRouter();

    const [keyword, setKeyword] = useState("");

    const { filters, setMinPrice, setMaxPrice, setYear, setSemester } = useFilters();

    const { minPrice, maxPrice, year, semester } = filters;

    const { data: notes } = api.notes.fetchNotesByAuthorId.useQuery({
        authorId: router.query.id as string,
        keyword,
        minPrice,
        maxPrice,
        year,
        semester,
    });

    if (username === "") {
        return (
            <main className="mx-auto w-4/5 min-w-[600px] pt-2 tracking-wide">
                <h1 className="my-2 text-4xl font-medium">此使用者不存在</h1>
            </main>
        );
    }

    return (
        <main className="mx-auto w-4/5 min-w-[600px] pt-2 tracking-wide">
            <h1 className="my-2 text-4xl font-medium">{username}</h1>

            <div className="border-b-2 border-slate-300 pt-4">
                <SearchBar
                    placeholder="輸入課號、筆記名稱、教授名稱或課名進行搜尋"
                    onChange={setKeyword}
                />

                <div className="flex gap-x-3.5 py-4">
                    {keyword && (
                        <KeywordChip
                            keyword={keyword}
                            onDelete={() => setKeyword("")}
                        />
                    )}

                    <PriceChip
                        filters={filters}
                        onMinPriceChange={setMinPrice}
                        onMaxPriceChange={setMaxPrice}
                    />

                    <SemesterChip
                        filters={filters}
                        onYearChange={setYear}
                        onSemesterChange={setSemester}
                    />
                </div>
            </div>

            <ul className="grid grid-cols-3 gap-4 pt-4">
                {notes?.map((note) => (
                    <NoteCard key={note.id} note={note} />
                ))}
            </ul>
        </main>
    );
};

export default StorePage;

export const getServerSideProps: GetServerSideProps<StorePageProps> = async (context) => {
    const id = context.query.id as string;

    const user = await prisma.user.findUnique({
        where: {
            id,
        },
    });

    return {
        props: {
            username: user?.name ?? "",
        },
    };
};
