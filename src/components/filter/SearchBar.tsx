import { useRef } from "react";
import type { CompositionEvent, KeyboardEvent } from "react";

import { AiOutlineSearch } from "react-icons/ai";

interface SearchBarProps {
    placeholder?: string;
    width?: string;
    onChange: (value: string) => void;
}

const SearchBar = ({ width = "", placeholder = "", onChange }: SearchBarProps) => {
    const { isCompositionEnd, handleCompositionEvent } = useCompositionEvent();

    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && isCompositionEnd() && buttonRef.current) {
            buttonRef.current.click();
        }
    };

    const inputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        if (inputRef.current) {
            onChange(inputRef.current.value);
            inputRef.current.blur();
            inputRef.current.value = "";
        }
    };

    return (
        <div
            className={`relative flex rounded-md border border-slate-400 bg-white py-1.5 pl-1.5 pr-2 ${width}`}
        >
            <input
                type="text"
                ref={inputRef}
                placeholder=" "
                className="peer flex-1 bg-transparent px-1 py-2 text-lg tracking-wide md:py-0"
                onKeyDown={handleInputKeyDown}
                onCompositionStart={handleCompositionEvent}
                onCompositionUpdate={handleCompositionEvent}
                onCompositionEnd={handleCompositionEvent}
            />

            <p className="pointer-events-none absolute inset-0 hidden items-center pl-2 text-slate-400 peer-placeholder-shown:flex">
                {placeholder}
            </p>

            <button
                ref={buttonRef}
                className="text-slate-400 hover:bg-black/5"
                onClick={handleButtonClick}
            >
                <AiOutlineSearch className="text-2xl" />
            </button>
        </div>
    );
};

export default SearchBar;

type CompositionStatus = "compositionstart" | "compositionupdate" | "compositionend";

export const useCompositionEvent = () => {
    /**
     * If we set default status to `compositionstart`, and the developer use the composition
     * status as a condition for some actions to be executed, the English user will not be
     * able to meet the condition until the `compositionend` event is triggered.
     * Therefore, we need to set the default status to `compositionend`.
     */
    const compositionStatusRef = useRef<CompositionStatus>("compositionend");

    const handleCompositionEvent = (event: CompositionEvent<HTMLInputElement>) => {
        compositionStatusRef.current = event.type as CompositionStatus;
    };

    return {
        isCompositionEnd: () => {
            return compositionStatusRef.current === "compositionend";
        },
        handleCompositionEvent,
    };
};
