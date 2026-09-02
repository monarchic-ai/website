const withoutTrailingSlash = (value: string) => value.replace(/\/$/, "");

const defaultWebappBaseUrl = import.meta.env.DEV
  ? "http://localhost:4327"
  : "https://app.monarchic.io";

export const webappBaseUrl = withoutTrailingSlash(
  import.meta.env.PUBLIC_MONARCHIC_WEBAPP_BASE_URL ||
    defaultWebappBaseUrl,
);
