// Web shim for @stripe/stripe-react-native (native-only SDK)
export const StripeProvider = ({ children }: any) => children;
export const CardField = () => null;
export const CardForm = () => null;
export const useStripe = () => ({});
export const useConfirmPayment = () => ({
  confirmPayment: async () => ({ error: { message: "Not supported on web" } }),
});
export const useConfirmSetupIntent = () => ({
  confirmSetupIntent: async () => ({
    error: { message: "Not supported on web" },
  }),
});
export const usePlatformPay = () => ({
  isPlatformPaySupported: false,
  confirmPlatformPayPayment: async () => ({}),
});
export default {};
