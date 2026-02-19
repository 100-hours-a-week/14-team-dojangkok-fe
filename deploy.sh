#!/bin/bash
exec > >(tee -a /var/log/deploy.log) 2>&1
echo "=== 배포 시작: $(date) ==="

cd /home/ubuntu/dojangkok-fe

# 1. .env 파일의 보안 권한 세팅
chmod 600 .env

# 2. AWS ECR 로그인
REGION="ap-northeast-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# 3. Docker Compose 실행
docker-compose pull
docker-compose down --remove-orphans || true
docker-compose up -d

# 4. 불필요한 Docker Image 정리
docker image prune -a -f

echo "=== 배포 완료 ==="