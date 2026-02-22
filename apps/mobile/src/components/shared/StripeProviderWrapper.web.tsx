import React from "react";

// no-op on web
export function StripeProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
