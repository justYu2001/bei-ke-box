import { useState } from "react";

export interface Filters {
    minPrice: number;
    maxPrice: number;
    year: number;
    semester: number;
    updatedAt: number;
}

type InitialFilters = Omit<Filters, "updatedAt">;

export interface FiltersSetter {
    (filters: Filters): void;
}

export interface PriceSetter {
    (price: number): void;
}

export interface YearSetter {
    (year: number): void;
}

export interface SemesterSetter {
    (semester: number): void;
}

interface FiltersHook {
    (initialValue?: InitialFilters): {
        filters: Filters;
        setMinPrice: PriceSetter;
        setMaxPrice: PriceSetter;
        setYear: YearSetter;
        setSemester: SemesterSetter;
        setFilters: FiltersSetter;
    };
}

const getRocYear = () => {
    const date = new Date();
    return date.getFullYear() - 1911;
};

const getSemester = () => {
    const date = new Date();
    const month = date.getMonth() + 1;

    if (month > 1 && month < 7) {
        return {
            year: getRocYear() - 1,
            semester: 2,
        };
    }

    return {
        year: getRocYear(),
        semester: 1,
    };
};

const defaultFilters: InitialFilters = (() => {
    const { year, semester } = getSemester();

    return {
        minPrice: 0,
        maxPrice: 1_000_000,
        year,
        semester,
    };
})();

export const useFilters: FiltersHook = (initialValue = defaultFilters) => {
    const [updatedAt, setUpdateAt] = useState(Date.now());

    const update = (fn: () => void) => {
        fn();
        setUpdateAt(Date.now());
    }

    const [minPrice, setMinPrice] = useState(initialValue.minPrice);
    const [maxPrice, setMaxPrice] = useState(initialValue.maxPrice);
    const [year, setYear] = useState(initialValue.year);
    const [semester, setSemester] = useState(initialValue.semester);

    const setFilters: FiltersSetter = ({ minPrice, maxPrice, year, semester }) => {
        update(() => {
            setMinPrice(minPrice);
            setMaxPrice(maxPrice);
            setYear(year);
            setSemester(semester);
        });  
    };

    return {
        filters: {
            minPrice,
            maxPrice,
            year,
            semester,
            updatedAt,
        },
        setMinPrice: (price) => update(() => setMinPrice(price)),
        setMaxPrice: (price) => update(() => setMaxPrice(price)),
        setSemester: ((semester) => update(() => setSemester(semester))),
        setYear: ((year) => update(() => {
            setYear(year);
            setSemester(1);
        })),
        setFilters,
    };
};
