import { useState } from "react";

interface ModalHook {
    (): {
        isOpen: boolean;
        toggleModal: () => void;
    };
}

export const useModal: ModalHook = () => {
    const [isOpen, setIsOpen] = useState(false);

    return {
        isOpen,
        toggleModal: () => setIsOpen(!isOpen),
    };
};
