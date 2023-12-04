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

export interface IAuthConfig {
  jwtSecret: string;
  jwtExpires: string;
  jwtRefreshSecret: string;
  jwtRefreshExpires: string;
  verifyEmailExpires: string;
  resetPasswordExpires: string;
  google: {
    clientId: string;
    clientSecret: string;
  };
  facebook: {
    clientId: string;
    clientSecret: string;
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
  database: IDatabaseConfig;
  auth: IAuthConfig;
  mailer: IMailerConfig;
  file: IFileConfig;
}
