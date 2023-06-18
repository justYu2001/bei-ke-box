import type { ReactNode } from "react";

import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";

import Modal from "@/components/common/Modal";

interface FilterChipProps {
    children: ReactNode;
}

const FilterChip = ({ children }: FilterChipProps) => {
    return <div className="relative">{children}</div>;
};

interface ChipProps {
    isOpen: boolean;
    onClick: () => void;
    children: ReactNode;
}

const Chip = ({ isOpen, onClick, children }: ChipProps) => {
    return (
        <div
            onClick={onClick}
            className="flex cursor-pointer items-center gap-x-1 rounded-md border border-slate-300 bg-white py-2 pl-4 pr-3"
        >
            <p>{children}</p>

            {isOpen ? (
                <TiArrowSortedUp className="text-lg" />
            ) : (
                <TiArrowSortedDown className="text-lg" />
            )}
        </div>
    );
};

interface DropdownFilterProps {
    title: string;
    isOpen: boolean;
    height?: string;
    width?: string;
    onClose: () => void;
    onChange: () => void;
    children: ReactNode;
}

const DropdownFilter = ({
    title,
    height = "",
    width = "",
    isOpen,
    onChange,
    onClose,
    children,
}: DropdownFilterProps) => {
    return (
        <Modal
            isOpen={isOpen}
            from="scale-[0.3] opacity-0"
            fullScreen={false}
            onClose={onClose}
            className={`${height} ${width} left-0 top-12 flex origin-top-left flex-col p-4 shadow-md`}
        >
            <h3 className="my-2 text-lg font-medium">{title}</h3>

            {children}

            <div className="flex justify-end pt-6">
                <button
                    onClick={onChange}
                    className="rounded-md bg-amber-400 px-3 py-2 text-white"
                >
                    重新搜尋
                </button>
            </div>
        </Modal>
    );
};

export default Object.assign(FilterChip, {
    Chip,
    DropdownFilter,
});
