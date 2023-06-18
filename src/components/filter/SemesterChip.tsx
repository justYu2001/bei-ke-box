import { useEffect } from "react";

import Listbox from "@/components/common/Listbox";
import type { ListboxOption } from "@/components/common/Listbox";
import FilterChip from "@/components/filter/FilterChip";
import { useFilters } from "@/hooks/filter";
import type { Filters, SemesterSetter, YearSetter } from "@/hooks/filter";
import { useModal } from "@/hooks/modal";
import { api } from "@/utils/api";

interface SemesterChipProps {
    filters: Filters;
    onYearChange: YearSetter;
    onSemesterChange: SemesterSetter;
}

const SemesterChip = ({ filters, onYearChange, onSemesterChange }: SemesterChipProps) => {
    const {
        filters: newFilters,
        setYear: setNewYear,
        setSemester: setNewSemester,
        setFilters: setNewFilters,
    } = useFilters();

    useEffect(() => {
        if (filters.updatedAt > newFilters.updatedAt) {
            setNewFilters(filters);
        }
    }, [filters, newFilters, setNewFilters]);

    const { isOpen, toggleModal } = useModal();

    const updatePrice = () => {
        toggleModal();
        onYearChange(newFilters.year);
        onSemesterChange(newFilters.semester);
    };

    const handleDropdownMenuClose = () => {
        toggleModal();
        setNewYear(filters.year);
        setNewSemester(filters.semester);
    };

    return (
        <FilterChip>
            <FilterChip.Chip isOpen={isOpen} onClick={toggleModal}>
                {filters.year} {filters.semester === 1 ? "上" : "下"}學期
            </FilterChip.Chip>

            <FilterChip.DropdownFilter
                title="開課時間"
                width="w-[600px]"
                isOpen={isOpen}
                onChange={updatePrice}
                onClose={handleDropdownMenuClose}
            >
                <SemesterListboxGroup
                    year={newFilters.year}
                    semester={newFilters.semester}
                    onYearChange={setNewYear}
                    onSemesterChange={setNewSemester}
                />
            </FilterChip.DropdownFilter>
        </FilterChip>
    );
};

export default SemesterChip;

interface SemesterListboxGroupProps {
    year: number;
    semester: number;
    onYearChange: YearSetter;
    onSemesterChange: SemesterSetter;
}

const SemesterListboxGroup = ({
    year,
    semester,
    onYearChange,
    onSemesterChange,
}: SemesterListboxGroupProps) => {
    return (
        <div className="flex justify-between px-1">
            <YearListbox year={year} onChange={onYearChange} />

            <SemesterListbox semester={semester} onChange={onSemesterChange} />
        </div>
    );
};

interface YearListboxProps {
    year: number;
    onChange: YearSetter;
}

const YearListbox = ({ year, onChange }: YearListboxProps) => {
    const { data } = api.years.fetchYears.useQuery();

    const yearOptions: ListboxOption<number>[] = data?.map((year) => ({
                                                    id: year.toString(),
                                                    name: year.toString(),
                                                    value: year,
                                                })) ?? [];

    return (
        <div>
            <label
                htmlFor="county"
                className="my-1.5 block text-xl font-medium"
            >
                學年度
            </label>

            <Listbox<number>
                id="county"
                options={yearOptions}
                option={year.toString()}
                onChange={onChange}
                className="w-64"
            />
        </div>
    );
};

interface SemesterListboxProps {
    semester: number;
    onChange: SemesterSetter;
}

const SemesterListbox = ({ semester, onChange }: SemesterListboxProps) => {
    return (
        <div>
            <label
                htmlFor="district"
                className="my-1.5 block text-xl font-medium"
            >
                學期
            </label>

            <Listbox<number>
                id="district"
                options={semesterOptions}
                option={semester === 1 ? "上學期" : "下學期"}
                onChange={onChange}
                className="w-64"
            />
        </div>
    );
};

const semesterOptions: ListboxOption<number>[] = [1, 2].map((semester) => ({
    id: semester.toString(),
    name: semester === 1 ? "上學期" : "下學期",
    value: semester,
}));
