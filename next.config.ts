import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Docker 컨테이너 실행을 위한 타겟 설정 추가
  output: 'standalone',
  // 프로덕션 빌드 시 console.log 자동 제거
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'], // error와 warn은 유지
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'http',
        hostname: 't1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net',
      },
      {
        protocol: 'http',
        hostname: 'img1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'img1.kakaocdn.net',
      },
    ],
  },
};

export default nextConfig;
