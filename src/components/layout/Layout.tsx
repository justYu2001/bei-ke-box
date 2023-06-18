import type { ReactNode } from "react";

import Header from "@/components/layout/Header";

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <>
            <Header />
            {children}
        </>
    );
};

export default Layout;