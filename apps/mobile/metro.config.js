const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Merge with Expo's default watchFolders instead of replacing them
config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Prevent @stripe/stripe-react-native from being bundled on web/SSR
  // where it tries to import react-native internals that don't exist.
  if (
    (platform === "web" || platform == null) &&
    moduleName === "@stripe/stripe-react-native"
  ) {
    return {
      filePath: path.resolve(projectRoot, "src/shims/stripe.web.ts"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./src/styles/global.css",
});
