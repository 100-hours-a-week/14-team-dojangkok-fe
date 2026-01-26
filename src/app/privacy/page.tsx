'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/common';
import styles from './Privacy.module.css';

export default function PrivacyPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <Header
        title="개인정보 처리방침"
        showBackButton={true}
        onBackClick={handleBack}
      />
      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            1. 개인정보의 수집 및 이용 목적
          </h2>
          <p className={styles.text}>
            도장콕(이하 &quot;회사&quot;)은 다음의 목적을 위하여 개인정보를
            처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는
            이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등
            필요한 조치를 이행할 예정입니다.
          </p>
          <ul className={styles.list}>
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 및 계약 이행</li>
            <li>계약서 분석 서비스 제공</li>
            <li>집노트 작성 및 관리</li>
            <li>맞춤형 콘텐츠 추천</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. 수집하는 개인정보 항목</h2>
          <p className={styles.text}>
            회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다.
          </p>
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>필수 수집 항목</h3>
            <ul className={styles.list}>
              <li>카카오 계정 정보 (이메일, 프로필 이미지)</li>
              <li>닉네임</li>
              <li>라이프스타일 태그</li>
            </ul>
          </div>
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>자동 수집 항목</h3>
            <ul className={styles.list}>
              <li>서비스 이용 기록</li>
              <li>접속 로그</li>
              <li>쿠키</li>
              <li>기기 정보</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            3. 개인정보의 보유 및 이용 기간
          </h2>
          <p className={styles.text}>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
            개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
            개인정보를 처리·보유합니다.
          </p>
          <ul className={styles.list}>
            <li>
              회원 가입 정보: 회원 탈퇴 시까지 (단, 관련 법령에 따라 보존이
              필요한 경우 해당 기간 동안 보관)
            </li>
            <li>서비스 이용 기록: 3개월</li>
            <li>계약서 분석 데이터: 회원 탈퇴 또는 삭제 요청 시까지</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. 개인정보의 제3자 제공</h2>
          <p className={styles.text}>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 다음의 경우에는 예외로 합니다:
          </p>
          <ul className={styles.list}>
            <li>이용자가 사전에 동의한 경우</li>
            <li>
              법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에
              따라 수사기관의 요구가 있는 경우
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. 개인정보 처리의 위탁</h2>
          <p className={styles.text}>
            회사는 서비스 제공을 위하여 필요한 경우 개인정보 처리 업무를 외부
            전문업체에 위탁할 수 있습니다.
          </p>
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>위탁 업무 내용</h3>
            <ul className={styles.list}>
              <li>카카오: 소셜 로그인 서비스</li>
              <li>클라우드 서비스 제공업체: 데이터 저장 및 관리</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            6. 이용자 및 법정대리인의 권리와 행사 방법
          </h2>
          <p className={styles.text}>
            이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:
          </p>
          <ul className={styles.list}>
            <li>개인정보 열람 요구</li>
            <li>개인정보 정정 요구</li>
            <li>개인정보 삭제 요구</li>
            <li>개인정보 처리 정지 요구</li>
          </ul>
          <p className={styles.text}>
            권리 행사는 서비스 내 설정 메뉴 또는 고객센터를 통해 가능합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. 개인정보의 파기</h2>
          <p className={styles.text}>
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
            불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
          </p>
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>파기 방법</h3>
            <ul className={styles.list}>
              <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
              <li>종이 문서: 분쇄 또는 소각</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. 개인정보 보호책임자</h2>
          <p className={styles.text}>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
            처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 개인정보
            보호책임자를 지정하고 있습니다.
          </p>
          <div className={styles.contactBox}>
            <p className={styles.contactText}>연락처는 추후 공지 예정입니다.</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            9. 개인정보 자동 수집 장치의 설치·운영 및 거부
          </h2>
          <p className={styles.text}>
            회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키를
            사용합니다. 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수
            있으나, 이 경우 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. 개인정보 처리방침의 변경</h2>
          <p className={styles.text}>
            본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의
            추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 서비스 내
            공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <div className={styles.footer}>
          <p className={styles.footerText}>시행일자: 2026년 1월 26일</p>
        </div>
      </main>
    </div>
  );
}
