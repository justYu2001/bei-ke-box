import { useEffect } from "react";
import type { ReactNode } from "react";

import Portal from "@/components/common/Portal";

interface ModalProps {
    isOpen: boolean;
    className?: string;
    from?: string;
    to?: string;
    fullScreen?: boolean;
    onClose: () => void;
    children: ReactNode;
}

const Modal = ({
    isOpen,
    className = "",
    from = "",
    to = "",
    fullScreen = true,
    onClose,
    children,
}: ModalProps) => {
    useEffect(() => {
        const { body } = document;
        
        if (isOpen) {
            body.style.position = "fixed";
            body.style.inset = "0";
        } else {
            body.style.position = "";
            body.style.inset = "";
        }
    }, [isOpen]);

    if (fullScreen) {
        return (
            <Portal>
                <Overlay isOpen={isOpen} onClick={onClose} />

                <Panel
                    isOpen={isOpen}
                    className={className}
                    to={to}
                    from={from}
                >
                    {children}
                </Panel>
            </Portal>
        );
    }

    return (
        <>
            <Overlay
                isOpen={isOpen}
                fullScreen={fullScreen}
                onClick={onClose}
            />

            <Panel
                isOpen={isOpen}
                fullScreen={fullScreen}
                className={className}
                to={to}
                from={from}
            >
                {children}
            </Panel>
        </>
    );
};

export default Modal;

interface OverlayProps {
    isOpen: boolean;
    fullScreen?: boolean;
    onClick: () => void;
}

const Overlay = ({ isOpen, fullScreen = true, onClick }: OverlayProps) => {
    return (
        <div className={`fixed inset-0 ${isOpen ? "" : "pointer-events-none"}`}>
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
                    isOpen && fullScreen ? "opacity-100" : "opacity-0"
                }`}
                onClick={onClick}
            />
        </div>
    );
};

interface PanelProps {
    isOpen: boolean;
    className?: string;
    from?: string;
    to?: string;
    fullScreen?: boolean;
    children: ReactNode;
}

const Panel = ({
    isOpen,
    fullScreen = true,
    className = "",
    to = "",
    from = "",
    children,
}: PanelProps) => {
    return (
        <div
            onClick={(event) => event.stopPropagation()}
            className={`${className} absolute ${
                fullScreen ? "inset-0 m-auto" : ""
            } rounded-md bg-white transition-all duration-300 ${
                isOpen ? to : from
            }`}
        >
            {children}
        </div>
    );
};
