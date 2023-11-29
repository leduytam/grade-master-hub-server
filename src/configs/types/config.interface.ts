export interface IAppConfig {
  name: string;
  clientUrl: string;
  env: string;
  port: number;
  apiPrefix: string;
  workingDir: string;
  serverUrl: string;
}

export interface IDatabaseConfig {
  url: string;
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  migrationsRun: boolean;
  timezone: string;
  logging: string | boolean;
  ssl: {
    rejectUnauthorized: boolean;
    ca: string;
    key: string;
    cert: string;
  };
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

export interface IFileConfig {
  driver: string;
  maxSize: number;
  local: {
    folder: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

export interface IAllConfig {
  app: IAppConfig;
  mailer: IMailerConfig;
  database: IDatabaseConfig;
  file: IFileConfig;
}
