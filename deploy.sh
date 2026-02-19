#!/bin/bash
# 로그 파일 권한 문제 방지를 위해 경로 변경 권장
LOG_FILE="/home/ubuntu/deploy.log"
exec > >(tee -a $LOG_FILE) 2>&1
echo "=== 배포 시작: $(date) ==="

# 1. 디렉토리가 없으면 생성하고 이동
TARGET_DIR="/home/ubuntu/dojangkok-fe"
mkdir -p $TARGET_DIR
cd $TARGET_DIR

# 2. .env 보안 세팅 (파일이 있는지 확인 후)
if [ -f .env ]; then
    chmod 600 .env
fi

# 3. AWS 로그인 및 도커 실행
REGION="ap-northeast-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# 4. Docker Compose 실행 (docker-compose가 설치되어 있는지 확인 필수)
docker-compose pull
docker-compose down --remove-orphans || true
docker-compose up -d

echo "=== 배포 완료 ==="