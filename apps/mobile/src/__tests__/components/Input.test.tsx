import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Input from "@/components/shared/Input";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => require("@/test/mocks/kiado-shared").lightTheme,
}));

describe("Input", () => {
  it("renders label", async () => {
    const { getByText } = await render(<Input label="Email" />);
    expect(getByText("Email")).toBeTruthy();
  });

  it("renders placeholder", async () => {
    const { getByPlaceholderText } = await render(<Input placeholder="Enter email" />);
    expect(getByPlaceholderText("Enter email")).toBeTruthy();
  });

  it("shows error message when provided", async () => {
    const { getByText } = await render(<Input errorMessage="Required" />);
    expect(getByText("Required")).toBeTruthy();
  });

  it("does not show error when absent", async () => {
    const { queryByText } = await render(<Input label="Field" />);
    expect(queryByText("Required")).toBeNull();
  });

  it("calls onChangeText when text changes", async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(<Input onChangeText={onChange} testID="input" />);
    fireEvent.changeText(getByTestId("input"), "hello");
    expect(onChange).toHaveBeenCalledWith("hello");
  });
});
