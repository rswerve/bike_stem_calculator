module.exports = {
    reactStrictMode: true,
    i18n: {
        locales: ["en"],
        defaultLocale: "en",
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };

        return config;
    },
};
