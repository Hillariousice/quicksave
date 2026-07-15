export { default } from "next-auth/middleware";

export const config = {
  // 👉 This locks down the /dashboard route and all its children!
  matcher: ["/dashboard/:path*"] 
};