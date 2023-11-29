export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME?: string;
      CLIENT_URL?: string;
      NODE_ENV?: string;
      PORT?: string;
      SERVER_URL?: string;

      MAILER_PORT?: string;
      MAILER_HOST?: string;
      MAILER_USER?: string;
      MAILER_PASSWORD?: string;
      MAILER_DEFAULT_EMAIL?: string;
      MAILER_DEFAULT_NAME?: string;
      MAILER_IGNORE_TLS?: string;
      MAILER_SECURE?: string;
      MAILER_REQUIRE_TLS?: string;
    }
  }
}
