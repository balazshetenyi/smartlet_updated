import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "@/components/shared/Button";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => require("@/test/mocks/kiado-shared").lightTheme,
}));

describe("Button", () => {
  it("renders with title", async () => {
    const { getByText } = await render(<Button title="Press me" onPress={jest.fn()} />);
    expect(getByText("Press me")).toBeTruthy();
  });

  it("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(getByText("Tap"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders outline variant title in primary colour", async () => {
    const { lightTheme } = require("@/test/mocks/kiado-shared");
    const { getByText } = await render(<Button title="Outline" onPress={jest.fn()} type="outline" />);
    expect(getByText("Outline")).toHaveStyle({ color: lightTheme.primary });
  });

  it("renders clear variant title in primary colour", async () => {
    const { lightTheme } = require("@/test/mocks/kiado-shared");
    const { getByText } = await render(<Button title="Clear" onPress={jest.fn()} type="clear" />);
    expect(getByText("Clear")).toHaveStyle({ color: lightTheme.primary });
  });
});
