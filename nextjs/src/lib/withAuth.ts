import axios, { AxiosError } from 'axios';
import { createAxiosInstance } from './axios';
import { PROTECTED_ROUTES, GUEST_ROUTES, VERIFY_EMAIL_ROUTE, REDIRECT_IF_AUTHENTICATED, REDIRECT_IF_NOT_AUTHENTICATED, EMAIL_VERIFICATION_ROUTE } from './route-service-provider';
import { User, GetServerSidePropsContext, WithAuthServerSidePropsFunc, AuthPageProps} from '@/types/auth';
import type { GetServerSideProps } from 'next'

interface RedirectResponse {
    redirect: {
        destination: string;
        emailVerified?: boolean;
        permanent?: boolean;
    };
}

interface UserResponse {
    data: User;
}

// Type guard functions
function isRedirectResponse(response: UserResponse | RedirectResponse | null): response is RedirectResponse {
    if (!response) return false;
    return 'redirect' in response && 
           typeof response.redirect === 'object' &&
           typeof response.redirect.destination === 'string';
}

function isUserResponse(response: UserResponse | RedirectResponse | null): response is UserResponse {
    if (!response) return false;
    return 'data' in response && 
           typeof response.data === 'object' &&
           response.data !== null;
}

export function withAuth(getServerSidePropsFunc?: WithAuthServerSidePropsFunc) {
    return async (context: GetServerSidePropsContext): Promise<{ props: AuthPageProps } | RedirectResponse> => {
        const { req, res } = context;

        const getUserData = async (): Promise<UserResponse | RedirectResponse | null> => {
            try {
                const axiosInstance = createAxiosInstance(req, res);
                const response = await axiosInstance.get<UserResponse>('/api/user');
                return response.data;
            } catch (error: unknown) {
                if (axios.isAxiosError<{message: string}>(error)) {
                    if (error.response?.status === 409 && 
                        error.response.data?.message === 'Your email address is not verified.') {
                        return {
                            redirect: {
                                emailVerified: false,
                                destination: EMAIL_VERIFICATION_ROUTE,
                            },
                        };
                    }
                }
                return null;
            }
        }

        const userResponse = await getUserData();
        const pathname = context.resolvedUrl.split('?')[0];

        const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
        const isGuestRoute = GUEST_ROUTES.includes(pathname);
        const isEmailVerifiedRoute = pathname.includes(VERIFY_EMAIL_ROUTE) || pathname.includes(EMAIL_VERIFICATION_ROUTE);

        // Handle redirect response
        if (isRedirectResponse(userResponse) && userResponse.redirect.emailVerified === false && !isEmailVerifiedRoute) {
            return {
                redirect: {
                    destination: EMAIL_VERIFICATION_ROUTE,
                    permanent: false,
                },
            };
        }

        // Extract user from response
        const user = isUserResponse(userResponse) ? userResponse.data : null;

        // Email verification redirect
        if (user && context.resolvedUrl === EMAIL_VERIFICATION_ROUTE && 
            'email_verified_at' in user && user.email_verified_at) {
            return {
                redirect: {
                    destination: REDIRECT_IF_AUTHENTICATED,
                    permanent: false,
                }
            };
        }

        // Protected route check
        if (!user && isProtectedRoute) {
            return {
                redirect: {
                    destination: REDIRECT_IF_NOT_AUTHENTICATED,
                    permanent: false,
                },
            };
        }

        // Guest route check
        if (user && isGuestRoute) {
            return {
                redirect: {
                    destination: REDIRECT_IF_AUTHENTICATED,
                    permanent: false,
                },
            };
        }

        // Handle server-side props
        if (getServerSidePropsFunc) {
            const pageProps = await getServerSidePropsFunc(context, user);
            if ('props' in pageProps) {
                return {
                    props: {
                        ...pageProps.props,
                        user: user || null,
                    },
                };
            }
            
            return pageProps as RedirectResponse;
        }

        return { props: { user: user || null } };
    };
}