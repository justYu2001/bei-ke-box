import { RxCross2 } from "react-icons/rx";

interface KeywordChipProps {
    keyword: string;
    onDelete: () => void;
}

const KeywordChip = ({ keyword, onDelete }: KeywordChipProps) => {
    return (
        <div className="flex items-center gap-x-1.5 rounded-md border border-slate-300 px-3 py-2 font-medium tracking-wide">
            {keyword}{" "}
            <RxCross2
                onClick={onDelete}
                className="cursor-pointer text-xl text-slate-400 transition-colors duration-300 hover:text-red-500"
            />
        </div>
    );
};

export default KeywordChip;
