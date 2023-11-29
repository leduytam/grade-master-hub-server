export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME?: string;
      CLIENT_URL?: string;
      NODE_ENV?: string;
      PORT?: string;
      SERVER_URL?: string;
    }
  }
}
