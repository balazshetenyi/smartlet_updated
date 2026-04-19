import { Toast } from "react-native-toast-notifications";

type ToastMessageProps = {
  message: string;
  type: "success" | "danger" | "warning" | "info";
  duration?: number;
};

export const showToastMessage = ({
  message,
  type,
  duration = 3000,
}: ToastMessageProps) => {
  Toast.show(message, {
    type: type,
    placement: "top",
    duration: duration,
    animationType: "slide-in",
  });
};
