
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_DEFAULT_RELAYS: string;
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_ENVIRONMENT: 'development' | 'production' | 'test';
  }
}
