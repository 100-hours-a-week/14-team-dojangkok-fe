'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/common';
import styles from './Terms.module.css';

export default function TermsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <Header title="이용약관" showBackButton={true} onBackClick={handleBack} />
      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제1조 (목적)</h2>
          <p className={styles.text}>
            본 약관은 도장콕(이하 &quot;회사&quot;)이 제공하는 계약서 분석
            서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의
            권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제2조 (정의)</h2>
          <p className={styles.text}>
            1. &quot;서비스&quot;란 회사가 제공하는 계약서 분석, 집노트 작성,
            매물 정보 제공 등의 모든 서비스를 의미합니다.
          </p>
          <p className={styles.text}>
            2. &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를
            이용하는 회원 및 비회원을 말합니다.
          </p>
          <p className={styles.text}>
            3. &quot;회원&quot;이란 회사와 서비스 이용계약을 체결하고 회원
            아이디를 부여받은 이용자를 말합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</h2>
          <p className={styles.text}>
            1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이
            발생합니다.
          </p>
          <p className={styles.text}>
            2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본
            약관을 변경할 수 있습니다.
          </p>
          <p className={styles.text}>
            3. 변경된 약관은 서비스 내 공지사항을 통해 공지하며, 공지 후 7일이
            경과한 시점부터 효력이 발생합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제4조 (서비스의 제공 및 변경)</h2>
          <p className={styles.text}>
            1. 회사는 다음과 같은 서비스를 제공합니다:
          </p>
          <ul className={styles.list}>
            <li>계약서 이미지 업로드 및 AI 기반 분석</li>
            <li>집노트 작성 및 관리</li>
            <li>매물 정보 제공</li>
            <li>라이프스타일 기반 맞춤 체크리스트 제공</li>
          </ul>
          <p className={styles.text}>
            2. 회사는 서비스의 내용을 변경할 수 있으며, 중요한 변경사항은 사전
            공지합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제5조 (서비스 이용시간)</h2>
          <p className={styles.text}>
            1. 서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다.
          </p>
          <p className={styles.text}>
            2. 회사는 시스템 점검, 보수, 교체 등의 사유로 서비스 제공을 일시
            중단할 수 있으며, 예정된 작업의 경우 사전에 공지합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제6조 (회원 가입)</h2>
          <p className={styles.text}>
            1. 이용자는 회사가 정한 가입 절차에 따라 회원 가입을 신청합니다.
          </p>
          <p className={styles.text}>
            2. 회사는 다음 각 호에 해당하는 경우 회원 가입을 승인하지 않을 수
            있습니다:
          </p>
          <ul className={styles.list}>
            <li>타인의 명의를 도용한 경우</li>
            <li>허위 정보를 기재한 경우</li>
            <li>관련 법령을 위반한 경우</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            제7조 (회원 탈퇴 및 자격 상실)
          </h2>
          <p className={styles.text}>
            1. 회원은 언제든지 서비스 내 회원 탈퇴 기능을 통해 탈퇴를 요청할 수
            있습니다.
          </p>
          <p className={styles.text}>
            2. 회원 탈퇴 시 관련 법령 및 개인정보처리방침에 따라 회사가 회원
            정보를 보유하는 경우를 제외하고는 모든 데이터가 삭제됩니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제8조 (개인정보 보호)</h2>
          <p className={styles.text}>
            회사는 이용자의 개인정보를 보호하기 위하여 관련 법령을 준수하며,
            개인정보의 보호 및 이용에 대해서는 개인정보 처리방침을 따릅니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제9조 (회사의 의무)</h2>
          <p className={styles.text}>
            1. 회사는 관련 법령과 본 약관을 준수하며, 계속적이고 안정적인
            서비스를 제공하기 위하여 최선을 다합니다.
          </p>
          <p className={styles.text}>
            2. 회사는 이용자의 개인정보 보호를 위해 보안 시스템을 구축하고
            관리합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제10조 (이용자의 의무)</h2>
          <p className={styles.text}>
            1. 이용자는 다음 행위를 하여서는 안 됩니다:
          </p>
          <ul className={styles.list}>
            <li>타인의 정보 도용</li>
            <li>허위 정보 게시</li>
            <li>서비스 운영 방해</li>
            <li>저작권 등 타인의 권리 침해</li>
            <li>불법 자료 유포</li>
          </ul>
        </section>

        <div className={styles.footer}>
          <p className={styles.footerText}>시행일자: 2026년 1월 26일</p>
        </div>
      </main>
    </div>
  );
}
