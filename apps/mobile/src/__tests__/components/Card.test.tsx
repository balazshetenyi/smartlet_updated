import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { Card } from "@/components/shared/Card";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => require("@/test/mocks/kiado-shared").lightTheme,
}));

describe("Card", () => {
  it("renders children", async () => {
    const { getByText } = await render(<Card><Text>Hello Card</Text></Card>);
    expect(getByText("Hello Card")).toBeTruthy();
  });

  it("renders multiple children", async () => {
    const { getByText } = await render(
      <Card>
        <Text>First</Text>
        <Text>Second</Text>
      </Card>,
    );
    expect(getByText("First")).toBeTruthy();
    expect(getByText("Second")).toBeTruthy();
  });
});
