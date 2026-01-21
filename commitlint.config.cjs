/**
 * Commit Message Rules (Commitlint)
 *
 * 기본 형식:
 *   <type>: <subject>
 *
 * 예시:
 *   feat: 로그인 기능 추가
 *   fix: 결제 오류 수정
 *
 * [type 규칙]
 * - 허용 type:
 *   build | chore | content | docs | feat | fix | refactor | style | test | deploy
 * - type은 반드시 소문자여야 함
 *
 * [subject 규칙]
 * - 최소 길이: 5자 이상
 * - 끝에 마침표(.) 사용 금지
 * - 대소문자 형식은 자유 (sentence / start / pascal / upper / lower 허용)
 *
 * [길이 제한]
 * - 커밋 헤더 전체 길이: 최대 72자
 *
 * ❌ 실패 예시
 * - Feat: login
 * - feat 로그인 추가
 * - chore: fix
 * - feat: 로그인 추가.
 *
 * ✅ 통과 예시
 * - feat: 로그인 기능 추가
 * - fix: 비밀번호 검증 오류 수정
 * - docs: README 사용 방법 정리
 */

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'subject-case': [
            2,
            'always',
            [
                'sentence-case',
                'start-case',
                'pascal-case',
                'upper-case',
                'lower-case',
            ],
        ],
        'type-enum': [
            2,
            'always',
            [
                'build',
                'chore',
                'content',
                'docs',
                'feat',
                'fix',
                'refactor',
                'style',
                'test',
                'deploy',
            ],
        ],
        'type-case': [2, 'always', 'lower-case'],
        'subject-full-stop': [2, 'never', '.'],
        'subject-min-length': [2, 'always', 5],
        'header-max-length': [2, 'always', 72],
    },
};
