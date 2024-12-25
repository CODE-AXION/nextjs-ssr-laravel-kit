import { NextPageContext } from 'next';
import { IncomingMessage, ServerResponse } from 'http';
import { GetServerSideProps } from 'next';

export interface ApiResponse<T = any> {
  message?: string;
  success?: boolean;
  error?: string;
  data?: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  password_confirmation: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  access_token_expiration: number;
  refresh_token_expiration: number;
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions?: Permission[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: Permission[];
}

  


export interface CsrfTokens {
    token: string;
    signature: string;
}

export interface AuthPageProps {
  user: User;
  [key: string]: any;
}

export interface GetServerSidePropsContext extends NextPageContext {
  req: IncomingMessage & {
    cookies: {
      [key: string]: string;
    };
  };
  res: ServerResponse;
  resolvedUrl: string;
}

export interface WithAuthServerSidePropsFunc {
  (context: GetServerSidePropsContext, user?: User | null): Promise<GetServerSideProps extends (...args: any) => Promise<infer R> ? Exclude<R, { props: AuthPageProps }> & { props?: AuthPageProps } : never>;
}
