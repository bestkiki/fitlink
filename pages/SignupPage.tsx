
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { Page } from '../UnauthenticatedApp';

interface SignupPageProps {
  onNavigate: (page: Page) => void;
  trainerId?: string | null;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, trainerId }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'trainer' | 'member'>(trainerId ? 'member' : 'trainer');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
        setError('비밀번호는 6자리 이상이어야 합니다.');
        setLoading(false);
        return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      if (user) {
        const userProfile: { role: 'trainer' | 'member', email: string, trainerId?: string } = {
          role,
          email,
        };
        if (role === 'member' && trainerId) {
          userProfile.trainerId = trainerId;
        }
        await db.collection('users').doc(user.uid).set(userProfile);
      }
      // Signup success is handled by the onAuthStateChanged listener in App.tsx
    } catch (err: any) {
      console.error("Signup Error:", err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-dark-accent p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {trainerId ? '회원가입' : '무료로 시작하기'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            이미 계정이 있으신가요?{' '}
            <button onClick={() => onNavigate('login')} className="font-medium text-primary hover:text-primary-dark focus:outline-none">
              로그인
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {!trainerId && (
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setRole('trainer')}
                className={`px-4 py-2 rounded-md font-medium ${role === 'trainer' ? 'bg-primary text-white' : 'bg-dark text-gray-300'}`}
              >
                트레이너
              </button>
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`px-4 py-2 rounded-md font-medium ${role === 'member' ? 'bg-secondary text-white' : 'bg-dark text-gray-300'}`}
              >
                회원
              </button>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">이메일 주소</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-dark placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-dark placeholder-gray-500 text-white focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="비밀번호 (6자리 이상)"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">비밀번호 확인</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-dark placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary-dark disabled:bg-gray-500"
            >
              {loading ? '가입 중...' : '계정 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
