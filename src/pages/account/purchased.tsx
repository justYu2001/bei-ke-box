import type { NextPage } from "next";

import { useState } from "react";

import KeywordChip from "@/components/filter/KeywordChip";
import PriceChip from "@/components/filter/PriceChip";
import SearchBar from "@/components/filter/SearchBar";
import SemesterChip from "@/components/filter/SemesterChip";
import NoteCard from "@/components/note/NoteCard";
import { useFilters } from "@/hooks/filter";
import { api } from "@/utils/api";

const PurchasedNoteListPage: NextPage = () => {
    const [keyword, setKeyword] = useState("");

    const { filters, setMinPrice, setMaxPrice, setYear, setSemester } = useFilters();

    const { minPrice, maxPrice, year, semester } = filters;

    const { data: notes } = api.accounts.fetchPurchasedNotes.useQuery({
        keyword,
        minPrice,
        maxPrice,
        year,
        semester,
    });

    if (!notes || notes?.length === 0) {
        return (
            <main className="mx-auto w-4/5 min-w-[600px] pt-2 tracking-wide">
                <h1 className="my-2 text-4xl font-medium">已購買筆記</h1>

                <p className="my-4">您目前沒有購買過任何筆記</p>
            </main>
        );
    }

    return (
        <main className="mx-auto w-4/5 min-w-[600px] pt-2 tracking-wide">
            <h1 className="my-2 text-4xl font-medium">已購買筆記</h1>

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

export default PurchasedNoteListPage;
