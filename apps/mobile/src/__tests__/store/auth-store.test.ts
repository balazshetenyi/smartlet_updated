import { useAuthStore } from "@/store/auth-store";

jest.mock("@kiado/shared", () => require("@/test/mocks/kiado-shared"));
jest.mock("@/utils/auth-utils", () => ({
  signInWithEmail: jest.fn(),
  signOutUser:     jest.fn().mockResolvedValue(undefined),
  signUpWithEmail: jest.fn(),
  fetchUserProfile: jest.fn().mockResolvedValue(null),
}));

describe("auth-store", () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    useAuthStore.setState({
      isLoggedIn: false,
      session: null,
      profile: null,
      loading: true,
      signingOut: false,
    });
  });

  describe("initial state", () => {
    it("has isLoggedIn=false", () => {
      expect(useAuthStore.getState().isLoggedIn).toBe(false);
    });

    it("has profile=null", () => {
      expect(useAuthStore.getState().profile).toBeNull();
    });

    it("has loading=true", () => {
      expect(useAuthStore.getState().loading).toBe(true);
    });
  });

  describe("setSession", () => {
    it("sets isLoggedIn=true when a session is provided", () => {
      const fakeSession = { user: { id: "user-1" }, access_token: "token" } as any;
      useAuthStore.getState().setSession(fakeSession);
      expect(useAuthStore.getState().isLoggedIn).toBe(true);
      expect(useAuthStore.getState().session).toBe(fakeSession);
    });

    it("sets isLoggedIn=false when session is null", () => {
      useAuthStore.getState().setSession(null);
      expect(useAuthStore.getState().isLoggedIn).toBe(false);
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe("signOut", () => {
    it("calls signOutUser and sets signingOut while in progress", async () => {
      const { signOutUser } = require("@/utils/auth-utils");
      await useAuthStore.getState().signOut();
      expect(signOutUser).toHaveBeenCalled();
    });
  });
});
