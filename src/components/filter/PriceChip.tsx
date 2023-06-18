import { useEffect } from "react";
import type { ChangeEvent } from "react";

import FilterChip from "@/components/filter/FilterChip";
import { useFilters } from "@/hooks/filter";
import type { Filters, PriceSetter } from "@/hooks/filter";
import { useModal } from "@/hooks/modal";

interface PriceChipProps {
    filters: Filters;
    onMinPriceChange: PriceSetter;
    onMaxPriceChange: PriceSetter;
}

const PriceChip = ({
    filters,
    onMinPriceChange,
    onMaxPriceChange,
}: PriceChipProps) => {
    const {
        filters: newFilters,
        setMaxPrice: setNewMaxPrice,
        setMinPrice: setNewMinPrice,
        setFilters: setNewFilters,
    } = useFilters();

    useEffect(() => {
        if (filters.updatedAt > newFilters.updatedAt) {
            setNewFilters(filters);
        }
    }, [filters, newFilters, setNewFilters]);

    const { isOpen, toggleModal } = useModal();

    const updateRent = () => {
        toggleModal();
        onMinPriceChange(newFilters.minPrice);
        onMaxPriceChange(newFilters.maxPrice);
    };

    const handleDropdownMenuClose = () => {
        toggleModal();
        setNewMinPrice(filters.minPrice);
        setNewMaxPrice(filters.maxPrice);
    };

    return (
        <FilterChip>
            <FilterChip.Chip isOpen={isOpen} onClick={toggleModal}>
                {filters.minPrice} - {filters.maxPrice}
            </FilterChip.Chip>

            <FilterChip.DropdownFilter
                title="價格"
                width="w-[600px]"
                isOpen={isOpen}
                onChange={updateRent}
                onClose={handleDropdownMenuClose}
            >
                <PriceInputGroup
                    minPrice={newFilters.minPrice}
                    maxPrice={newFilters.maxPrice}
                    onMinPriceChange={setNewMinPrice}
                    onMaxPriceChange={setNewMaxPrice}
                />
            </FilterChip.DropdownFilter>
        </FilterChip>
    );
};

export default PriceChip;

interface PriceInputGroupProps {
    minPrice: number;
    maxPrice: number;
    onMinPriceChange: PriceSetter;
    onMaxPriceChange: PriceSetter;
}

const PriceInputGroup = ({
    minPrice,
    maxPrice,
    onMinPriceChange,
    onMaxPriceChange,
}: PriceInputGroupProps) => {
    const handleMinRentChange = (event: ChangeEvent<HTMLInputElement>) => {
        onMinPriceChange(parseInt(event.currentTarget.value));
    };

    const handleMaxRentChange = (event: ChangeEvent<HTMLInputElement>) => {
        onMaxPriceChange(parseInt(event.currentTarget.value));
    };

    return (
        <div className="mt-2 flex justify-between px-1">
            <div>
                <label
                    htmlFor="min-rent"
                    className="my-1.5 block text-xl font-medium"
                >
                    最低價格
                </label>
                <input
                    type="number"
                    id="min-rent"
                    value={minPrice}
                    step="any"
                    onChange={handleMinRentChange}
                    className="w-64 rounded-md border-2 border-slate-300 px-2 py-1.5 text-lg"
                />
            </div>
            <div>
                <label
                    htmlFor="max-rent"
                    className="my-1.5 block text-xl font-medium"
                >
                    最高價格
                </label>
                <input
                    type="number"
                    id="max-rent"
                    step="any"
                    value={maxPrice}
                    onChange={handleMaxRentChange}
                    className="w-64 rounded-md border-2 border-slate-300 px-2 py-1.5 text-lg"
                />
            </div>
        </div>
    );
};
