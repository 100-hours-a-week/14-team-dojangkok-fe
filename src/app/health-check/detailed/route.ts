import { NextResponse } from 'next/server';

/**
 * GET /health-check/detailed
 * 상세 헬스체크 엔드포인트
 * 서버 리소스 및 환경 정보 제공
 */
export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: {
        nodejs: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: {
          seconds: Math.floor(uptime),
          formatted: formatUptime(uptime),
        },
      },
      memory: {
        rss: {
          bytes: memoryUsage.rss,
          mb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        heapTotal: {
          bytes: memoryUsage.heapTotal,
          mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        heapUsed: {
          bytes: memoryUsage.heapUsed,
          mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
        external: {
          bytes: memoryUsage.external,
          mb: Math.round(memoryUsage.external / 1024 / 1024),
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      },
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * 업타임을 읽기 쉬운 형식으로 변환
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
