# AWS Parameter Store 설정 가이드

## 1. Parameter Store에 환경변수 등록

### 1.1 AWS CLI로 등록 (권장)

```bash
# BACKEND_URL 등록 (ALB DNS)
aws ssm put-parameter \
  --name "/ktb-community/frontend/backend-url" \
  --value "https://ktb-community-alb-1234567890.ap-northeast-2.elb.amazonaws.com" \
  --type "String" \
  --description "백엔드 ALB URL"

# LAMBDA_API_URL 등록 (API Gateway URL)
aws ssm put-parameter \
  --name "/ktb-community/frontend/lambda-api-url" \
  --value "https://abcdefghij.execute-api.ap-northeast-2.amazonaws.com" \
  --type "String" \
  --description "Lambda 이미지 업로드 API Gateway URL"

# PORT 등록 (기본값: 3000)
aws ssm put-parameter \
  --name "/ktb-community/frontend/port" \
  --value "3000" \
  --type "String" \
  --description "프론트엔드 서버 포트"
```

### 1.2 AWS Console로 등록

1. AWS Console → Systems Manager → Parameter Store
2. "Create parameter" 클릭
3. 파라미터 정보 입력:
   - Name: `/ktb-community/frontend/backend-url`
   - Type: String
   - Value: `https://your-alb-dns.elb.amazonaws.com`
4. "Create parameter" 클릭
5. Lambda API URL, PORT도 동일하게 등록

---

## 2. EC2 IAM Role 설정

### 2.1 IAM Policy 생성

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:ap-northeast-2:*:parameter/ktb-community/frontend/*"
      ]
    }
  ]
}
```

### 2.2 IAM Role에 Policy 연결

1. AWS Console → IAM → Roles
2. EC2 인스턴스에 연결된 Role 선택
3. "Attach policies" → 위에서 생성한 Policy 선택
4. "Attach policy" 클릭

---

## 3. 환경별 Parameter 관리

### 3.1 개발 환경

```bash
# Prefix: /ktb-community/dev/frontend
aws ssm put-parameter \
  --name "/ktb-community/dev/frontend/backend-url" \
  --value "http://dev-alb.elb.amazonaws.com" \
  --type "String"
```

### 3.2 스테이징 환경

```bash
# Prefix: /ktb-community/staging/frontend
aws ssm put-parameter \
  --name "/ktb-community/staging/frontend/backend-url" \
  --value "http://staging-alb.elb.amazonaws.com" \
  --type "String"
```

### 3.3 프로덕션 환경

```bash
# Prefix: /ktb-community/prod/frontend
aws ssm put-parameter \
  --name "/ktb-community/prod/frontend/backend-url" \
  --value "https://api.ktb-community.com" \
  --type "String"
```

### 3.4 배포 스크립트에서 환경 선택

```bash
# deploy-ec2.sh 수정
# PARAM_PREFIX="/ktb-community/frontend"  # ← 기본
PARAM_PREFIX="/ktb-community/${ENV}/frontend"  # ← 환경별

# 실행 시 환경변수 전달
ENV=dev ./deploy-ec2.sh      # 개발 환경
ENV=staging ./deploy-ec2.sh  # 스테이징 환경
ENV=prod ./deploy-ec2.sh     # 프로덕션 환경
```

---

## 4. 파라미터 조회 및 관리

### 4.1 파라미터 조회

```bash
# 단일 파라미터 조회
aws ssm get-parameter --name "/ktb-community/frontend/backend-url"

# 경로 기반 조회 (모든 프론트엔드 파라미터)
aws ssm get-parameters-by-path --path "/ktb-community/frontend"

# 재귀 조회 (하위 경로 포함)
aws ssm get-parameters-by-path --path "/ktb-community" --recursive
```

### 4.2 파라미터 업데이트

```bash
# 값 변경
aws ssm put-parameter \
  --name "/ktb-community/frontend/backend-url" \
  --value "https://new-alb.elb.amazonaws.com" \
  --type "String" \
  --overwrite  # ← 기존 값 덮어쓰기
```

### 4.3 파라미터 삭제

```bash
aws ssm delete-parameter --name "/ktb-community/frontend/backend-url"
```

---

## 5. 비용 최적화

### 5.1 Standard vs Advanced

| 항목 | Standard | Advanced |
|------|----------|----------|
| 파라미터 당 크기 | 4KB | 8KB |
| 파라미터 수 | 10,000개 | 100,000개 |
| 비용 | **무료** | $0.05/파라미터/월 |

**권장**: Standard 사용 (환경변수는 4KB 미만)

### 5.2 요청 비용

- **GetParameter**: 무료 (Standard Throughput)
- **High Throughput**: $0.05/10,000 요청

**권장**: Standard Throughput (배포 시에만 호출)

---

## 6. 보안 강화

### 6.1 SecureString 사용 (민감 정보)

```bash
# DB 비밀번호 등 민감 정보는 SecureString 사용
aws ssm put-parameter \
  --name "/ktb-community/frontend/db-password" \
  --value "MySecretPassword123!" \
  --type "SecureString" \
  --key-id "alias/aws/ssm"  # KMS 키 (기본값)
```

### 6.2 파라미터 접근 로그

CloudTrail로 Parameter Store 접근 기록 추적:
- 누가 (IAM User/Role)
- 언제 (Timestamp)
- 무엇을 (Parameter Name)
- 조회/변경/삭제했는지

---

## 7. 트러블슈팅

### 7.1 권한 에러

```bash
# 에러: An error occurred (AccessDeniedException)
# 해결: EC2 IAM Role에 ssm:GetParameter 권한 추가
```

### 7.2 파라미터 없음

```bash
# 에러: ParameterNotFound
# 해결: Parameter Store에 파라미터 등록 확인
aws ssm get-parameter --name "/ktb-community/frontend/backend-url"
```

### 7.3 배포 스크립트 실패

```bash
# 로그 확인
bash -x deploy-ec2.sh  # ← 디버그 모드 실행

# AWS CLI 설정 확인
aws configure list
aws sts get-caller-identity  # IAM Role/User 확인
```

---

## 8. 실제 배포 시나리오

### EC2에서 배포 실행

```bash
# 1. 스크립트 다운로드
wget https://raw.githubusercontent.com/your-repo/deploy-ec2.sh
chmod +x deploy-ec2.sh

# 2. 배포 실행
./deploy-ec2.sh

# 3. 로그 확인
docker logs -f ktb-frontend

# 4. /config.js 확인
curl http://localhost:3000/config.js
```

**출력 예시:**
```javascript
window.APP_CONFIG = {
  API_BASE_URL: 'https://ktb-community-alb-1234567890.ap-northeast-2.elb.amazonaws.com',
  LAMBDA_API_URL: 'https://abcdefghij.execute-api.ap-northeast-2.amazonaws.com'
};
```

---

## 9. 자동화 (선택)

### 9.1 GitHub Actions에서 Parameter Store 사용

```yaml
# .github/workflows/deploy.yml
- name: Deploy to EC2
  env:
    AWS_REGION: ap-northeast-2
  run: |
    ssh ec2-user@${{ secrets.EC2_HOST }} << 'EOF'
      cd /home/ec2-user
      ./deploy-ec2.sh
    EOF
```

### 9.2 CodeDeploy + Parameter Store

`appspec.yml`:
```yaml
version: 0.0
os: linux
hooks:
  ApplicationStart:
    - location: deploy-ec2.sh
      timeout: 300
```
