/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_ALLOW_REGISTRATION: process.env.ALLOW_REGISTRATION || 'false',
  },
};

module.exports = nextConfig;
