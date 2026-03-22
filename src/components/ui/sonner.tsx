import type React from "react";
import { Toaster as Sonner } from "sonner";

const Toaster = (props: React.ComponentProps<typeof Sonner>) => (
  <Sonner
    position="top-center"
    toastOptions={{
      classNames: {
        toast: "bg-white text-pure-black border border-pure-black/10 shadow-lg",
        title: "text-sm font-medium",
        description: "text-sm text-pure-black/70",
      },
    }}
    {...props}
  />
);

export { Toaster };
