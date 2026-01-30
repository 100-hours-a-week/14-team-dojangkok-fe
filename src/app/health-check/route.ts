import { NextResponse } from 'next/server';

/**
 * GET /health-check
 * 기본 헬스체크 엔드포인트
 * 인프라팀의 로드밸런서/모니터링 시스템에서 사용
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
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
