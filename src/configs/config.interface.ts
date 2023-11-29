export interface IAppConfig {
  name: string;
  clientUrl: string;
  env: string;
  port: number;
  apiPrefix: string;
  workingDir: string;
  serverUrl: string;
}

export interface IAllConfig {
  app: IAppConfig;
}
