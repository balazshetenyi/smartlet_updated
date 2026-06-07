import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SelectRoleScreen from "@/app/(auth)/select-role";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => require("@/test/mocks/kiado-shared").lightTheme,
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

describe("SelectRoleScreen", () => {
  beforeEach(() => mockPush.mockClear());

  it("renders both role cards", async () => {
    const { getByText } = await render(<SelectRoleScreen />);
    expect(getByText("I'm looking for a property")).toBeTruthy();
    expect(getByText("I own a property")).toBeTruthy();
  });

  it("tapping tenant card navigates to /sign-up?role=tenant", async () => {
    const { getByText } = await render(<SelectRoleScreen />);
    fireEvent.press(getByText("I'm looking for a property"));
    expect(mockPush).toHaveBeenCalledWith("/sign-up?role=tenant");
  });

  it("tapping landlord card navigates to /sign-up?role=landlord", async () => {
    const { getByText } = await render(<SelectRoleScreen />);
    fireEvent.press(getByText("I own a property"));
    expect(mockPush).toHaveBeenCalledWith("/sign-up?role=landlord");
  });

  it('"Sign in" link navigates to /sign-in', async () => {
    const { getByText } = await render(<SelectRoleScreen />);
    fireEvent.press(getByText("Sign in"));
    expect(mockPush).toHaveBeenCalledWith("/sign-in");
  });
});
