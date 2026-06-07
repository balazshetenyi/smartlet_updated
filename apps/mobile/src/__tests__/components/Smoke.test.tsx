import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

test("plain Text renders", async () => {
  const { getByText } = await render(<Text>hello</Text>);
  expect(getByText("hello")).toBeTruthy();
});
