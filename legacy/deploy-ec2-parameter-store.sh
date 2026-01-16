#!/bin/bash

# ========================================
# EC2 배포 스크립트 (Parameter Store 사용)
# ========================================
# 사전 요구사항:
# 1. AWS CLI 설치 및 설정 (IAM Role 또는 aws configure)
# 2. Docker 설치
# 3. EC2 IAM Role에 SSM Read 권한 필요
# ========================================

set -e  # 에러 발생 시 스크립트 중단

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}KTB 커뮤니티 프론트엔드 배포 시작${NC}"
echo -e "${GREEN}========================================${NC}"

# ========================================
# 1. Parameter Store에서 환경변수 가져오기
# ========================================
echo -e "\n${YELLOW}[1/5] Parameter Store에서 환경변수 가져오는 중...${NC}"

# Parameter Store 경로 설정 (환경별로 변경 가능)
PARAM_PREFIX="/ktb-community/frontend"

# 환경변수 가져오기 (에러 발생 시 기본값 사용)
BACKEND_URL=$(aws ssm get-parameter \
  --name "${PARAM_PREFIX}/backend-url" \
  --query "Parameter.Value" \
  --output text 2>/dev/null || echo "http://localhost:8080")

LAMBDA_API_URL=$(aws ssm get-parameter \
  --name "${PARAM_PREFIX}/lambda-api-url" \
  --query "Parameter.Value" \
  --output text 2>/dev/null || echo "")

PORT=$(aws ssm get-parameter \
  --name "${PARAM_PREFIX}/port" \
  --query "Parameter.Value" \
  --output text 2>/dev/null || echo "3000")

echo -e "${GREEN}✅ BACKEND_URL: ${BACKEND_URL}${NC}"
echo -e "${GREEN}✅ LAMBDA_API_URL: ${LAMBDA_API_URL:-'(not set)'}${NC}"
echo -e "${GREEN}✅ PORT: ${PORT}${NC}"

# ========================================
# 2. Docker Hub에서 이미지 Pull
# ========================================
echo -e "\n${YELLOW}[2/5] Docker Hub에서 이미지 Pull 중...${NC}"

DOCKER_IMAGE="wafriend1031/ktb-fe:latest"

docker pull ${DOCKER_IMAGE}

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 이미지 Pull 완료: ${DOCKER_IMAGE}${NC}"
else
  echo -e "${RED}❌ 이미지 Pull 실패${NC}"
  exit 1
fi

# ========================================
# 3. 기존 컨테이너 중지 및 제거
# ========================================
echo -e "\n${YELLOW}[3/5] 기존 컨테이너 중지 및 제거 중...${NC}"

CONTAINER_NAME="ktb-frontend"

# 실행 중인 컨테이너 중지
if [ $(docker ps -q -f name=${CONTAINER_NAME}) ]; then
  echo "기존 컨테이너 중지 중..."
  docker stop ${CONTAINER_NAME}
fi

# 중지된 컨테이너 제거
if [ $(docker ps -aq -f name=${CONTAINER_NAME}) ]; then
  echo "기존 컨테이너 제거 중..."
  docker rm ${CONTAINER_NAME}
fi

echo -e "${GREEN}✅ 기존 컨테이너 정리 완료${NC}"

# ========================================
# 4. 새 컨테이너 실행
# ========================================
echo -e "\n${YELLOW}[4/5] 새 컨테이너 실행 중...${NC}"

docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p ${PORT}:3000 \
  -e BACKEND_URL="${BACKEND_URL}" \
  -e LAMBDA_API_URL="${LAMBDA_API_URL}" \
  -e NODE_ENV="production" \
  ${DOCKER_IMAGE}

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 컨테이너 실행 완료${NC}"
else
  echo -e "${RED}❌ 컨테이너 실행 실패${NC}"
  exit 1
fi

# ========================================
# 5. 헬스 체크
# ========================================
echo -e "\n${YELLOW}[5/5] 헬스 체크 중...${NC}"

# 5초 대기 (컨테이너 시작 시간)
sleep 5

# 컨테이너 상태 확인
CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' ${CONTAINER_NAME})

if [ "${CONTAINER_STATUS}" = "running" ]; then
  echo -e "${GREEN}✅ 컨테이너 상태: ${CONTAINER_STATUS}${NC}"

  # 로그 확인 (config.js 생성 확인)
  echo -e "\n${YELLOW}컨테이너 로그 (최근 10줄):${NC}"
  docker logs --tail 10 ${CONTAINER_NAME}

  # HTTP 헬스 체크 (선택)
  if command -v curl &> /dev/null; then
    echo -e "\n${YELLOW}HTTP 헬스 체크:${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/config.js)

    if [ "${HTTP_STATUS}" = "200" ]; then
      echo -e "${GREEN}✅ HTTP 200 OK - /config.js 응답 정상${NC}"
      curl -s http://localhost:${PORT}/config.js
    else
      echo -e "${RED}❌ HTTP ${HTTP_STATUS} - /config.js 응답 실패${NC}"
    fi
  fi
else
  echo -e "${RED}❌ 컨테이너 상태: ${CONTAINER_STATUS}${NC}"
  echo -e "${RED}로그:${NC}"
  docker logs ${CONTAINER_NAME}
  exit 1
fi

# ========================================
# 배포 완료
# ========================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 배포 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "컨테이너 이름: ${CONTAINER_NAME}"
echo -e "포트: ${PORT}"
echo -e "이미지: ${DOCKER_IMAGE}"
echo -e "접속 주소: http://localhost:${PORT}"
echo -e "${GREEN}========================================${NC}"

# ========================================
# 유용한 명령어
# ========================================
echo -e "\n${YELLOW}유용한 명령어:${NC}"
echo "  컨테이너 로그 확인: docker logs -f ${CONTAINER_NAME}"
echo "  컨테이너 재시작:   docker restart ${CONTAINER_NAME}"
echo "  컨테이너 중지:     docker stop ${CONTAINER_NAME}"
echo "  컨테이너 제거:     docker rm -f ${CONTAINER_NAME}"
echo "  실행 중인 프로세스: docker ps"
