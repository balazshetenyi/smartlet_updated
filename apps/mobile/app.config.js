export default {
  expo: {
    name: "Kiado",
    slug: "kiado",
    version: "1.0.0",
    orientation: "portrait",
    icon: "../../packages/shared/assets/images/kiado_app_icon.png",
    scheme: "kiado",
    userInterfaceStyle: "automatic",
    splash: {
      image: "../../packages/shared/assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0B233C",
    },
    experiments: {
      autolinkingModuleResolution: true,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "uk.co.kiado.app",
      buildNumber: "1",
      associatedDomains: ["applinks:kiado.co.uk"],
      config: {
        usesNonExemptEncryption: false,
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
      },
      infoPlist: {
        CFBundleAllowMixedLocalizations: true,
        CFBundleLocalizations: ["en", "en"],
        NSCameraUsageDescription:
          "Kiado needs access to your camera to take photos of properties.",
        NSPhotoLibraryUsageDescription:
          "Kiado needs access to your photo library to select property images.",
        NSLocationWhenInUseUsageDescription:
          "Kiado uses your location to show nearby properties and help you search in your area.",
        LSApplicationQueriesSchemes: ["comgooglemaps", "googlechromes", "maps"],
      },
      appleTeamId: "KX78CU7UBV",
    },
    android: {
      package: "uk.co.kiado.app",
      versionCode: 1,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [{ scheme: "https", host: "kiado.co.uk", pathPrefix: "/" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      adaptiveIcon: {
        backgroundColor: "#1F2A37",
        foregroundImage:
          "../../packages/shared/assets/images/kiado_android_foreground_icon.png",
        monochromeImage:
          "../../packages/shared/assets/images/kiado_android_monochrome_icon.png",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.POST_NOTIFICATIONS",
      ],
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "../../packages/shared/assets/images/favicon.ico",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          backgroundColor: "#0B233C",
          image: "../../packages/shared/assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
        },
      ],
      "expo-router",
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          icon: "../../packages/shared/assets/images/kiado_app_icon.png",
          color: "#2C3E50",
          sounds: [],
          mode: "production",
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          note: "Use SENTRY_AUTH_TOKEN env to authenticate with Sentry.",
          project: "kiado",
          organization: "mozaik-software-solutions-ltd",
        },
      ],
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.uk.co.kiado.app",
        },
      ],
      "expo-image",
      "expo-secure-store",
      "expo-web-browser",
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "a28f9395-6497-4116-a831-a92f580d405e",
      },
    },
    owner: "mozaik-software-solutions-ltd",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/a28f9395-6497-4116-a831-a92f580d405e",
    },
  },
};
