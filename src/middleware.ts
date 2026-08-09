import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/', '/auth/login(.*)', '/auth/register(.*)', '/auth/logout(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/results(.*)', '/questions(.*)', '/claims(.*)', '/api(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
