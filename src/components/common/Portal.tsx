import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
    children: ReactNode;
}

const Portal = ({ children }: PortalProps) => {
    const [isOnClientSide, setIsOnClientSide] = useState(false);

    useEffect(() => {
        if (document) {
            setIsOnClientSide(true);
        }
    }, []);

    if (isOnClientSide) {
        return createPortal(children, document.body);
    }

    return null;
};

export default Portal;
