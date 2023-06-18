import type { NextPage } from "next";
import { useRouter } from "next/router";

import KeywordChip from "@/components/filter/KeywordChip";
import PriceChip from "@/components/filter/PriceChip";
import SemesterChip from "@/components/filter/SemesterChip";
import NoteCard from "@/components/note/NoteCard";
import { useFilters } from "@/hooks/filter";
import { api } from "@/utils/api";

const SearchPage: NextPage = () => {
    const router = useRouter();

    const keyword = (router.query.keyword as string | undefined) ?? "";

    const { filters, setMinPrice, setMaxPrice, setYear, setSemester } = useFilters();

    const { minPrice, maxPrice, year, semester } = filters;

    const { data: notes } = api.notes.searchNotes.useQuery({
        keyword,
        minPrice,
        maxPrice,
        year,
        semester,
    });

    return (
        <main className="px-20">
            <div className="border-b-2 border-slate-300 pt-4">
                <div className="flex gap-x-3.5 py-3">
                    {keyword && (
                        <KeywordChip
                            keyword={keyword}
                            onDelete={() => void router.push("/search")}
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

export default SearchPage;
