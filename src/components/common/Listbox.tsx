import { useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";

import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export interface ListboxOption<T> {
    id: string;
    name: string;
    value: T;
}

interface ListboxProps<T> {
    id?: string;
    option?: string;
    options: ListboxOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

const Listbox = <T = unknown,>({
    id,
    option = "",
    options,
    onChange,
    className = "",
}: ListboxProps<T>) => {
    const [keyword, setKeyword] = useState<string | undefined>(undefined);

    const [filteredOptions, setFilteredOptions] = useState<ListboxOption<T>[]>(
        []
    );

    const currentOptions =
        filteredOptions.length > 0 ? filteredOptions : options;

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newKeyword = event.currentTarget.value;

        const newFilteredOptions = options.filter(({ name }) => name.includes(newKeyword));

        setFilteredOptions(newFilteredOptions);
        setKeyword(newKeyword);
    };

    const handleOptionClick = (event: MouseEvent<HTMLOptionElement>) => {
        const newValueIndex = parseInt(event.currentTarget.value);
        const { value } = currentOptions[newValueIndex] as ListboxOption<T>;

        onChange(value);
    };

    const handleInputBlur = (event: FormEvent<HTMLInputElement>) => {
        const newKeyword = event.currentTarget.value;

        // Keyword is a dropbox's option.
        const isValidOption = options.some(({ name }) => newKeyword === name);

        // If Keyword is not a dropbox's option, clear keyword value.
        if (!isValidOption) {
            setKeyword(undefined);
        }
    };

    return (
        <div className="group relative">
            <div
                className={`${className} flex items-center rounded-md border-2 border-slate-300 py-1.5 pl-2 pr-1`}
            >
                <input
                    type="text"
                    value={keyword == undefined ? option : keyword}
                    id={id}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="flex-1 text-lg"
                />
                <label htmlFor={id} className="cursor-pointer">
                    <IoIosArrowDown className="text-lg group-focus-within:hidden" />
                    <IoIosArrowUp className="hidden text-lg group-focus-within:block" />
                </label>
            </div>

            <ul className="invisible absolute inset-x-0 top-12 z-50 max-h-56 overflow-y-scroll rounded-md bg-white shadow-md group-focus-within:visible">
                {currentOptions.map(({ id, name }, index) => (
                    <option
                        value={index}
                        key={id}
                        onMouseDown={handleOptionClick}
                        className="w-full cursor-pointer p-2.5 hover:bg-slate-100"
                    >
                        {name}
                    </option>
                ))}
            </ul>
        </div>
    );
};

export default Listbox;
