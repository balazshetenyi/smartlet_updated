/**
 * Test utilities — wraps components with all required providers.
 */
import { render, RenderOptions } from "@testing-library/react-native";
import React from "react";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react-native";
export { customRender as render };
