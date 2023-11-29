export interface IAppConfig {
  name: string;
  clientUrl: string;
  env: string;
  port: number;
  apiPrefix: string;
  workingDir: string;
  serverUrl: string;
}

export interface IMailerConfig {
  port: number;
  host: string;
  user: string;
  password: string;
  defaultEmail: string;
  defaultName: string;
  ignoreTLS: boolean;
  secure: boolean;
  requireTLS: boolean;
}

export interface IAllConfig {
  app: IAppConfig;
  mailer: IMailerConfig;
}
