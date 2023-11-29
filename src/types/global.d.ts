export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME?: string;
      CLIENT_URL?: string;
      NODE_ENV?: string;
      PORT?: string;
      SERVER_URL?: string;

      DB_URL?: string;
      DB_TYPE?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;
      DB_SYNCHRONIZE?: string;
      DB_MIGRATIONS_RUN?: string;
      DB_TIMEZONE?: string;
      DB_LOGGING?: string;
      DB_SSL_ENABLED?: string;
      DB_REJECT_UNAUTHORIZED?: string;
      DB_CA?: string;
      DB_KEY?: string;
      DB_CERT?: string;

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
