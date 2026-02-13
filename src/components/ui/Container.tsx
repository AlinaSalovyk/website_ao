import { cn } from "@/lib/utils";
import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const Container = ({ children, className, ...props }: ContainerProps) => {
    return (
        <div className={cn("mx-auto w-full max-w-7xl px-5 md:px-10", className)} {...props}>
            {children}
        </div>
    );
};
