
import React, { useState } from 'react';
// FIX: Removed v9 imports as they are not available in the v8 SDK.
import { auth, db } from '../firebase';
import { Page } from '../UnauthenticatedApp';

interface SignupPageProps {
  onNavigate: (page: Page) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('password-confirm') as string;
    const role = formData.get('role') as 'trainer' | 'member';

    if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다.");
        setLoading(false);
        return;
    }
    if (!role) {
        setError("역할(트레이너/회원)을 선택해주세요.");
        setLoading(false);
        return;
    }

    try {
      // FIX: Used v8's createUserWithEmailAndPassword method on the auth instance.
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error("User creation failed.");
      }

      // Firestore에 사용자 역할 정보 저장
      // FIX: Used v8 syntax for setting a firestore document.
      await db.collection("users").doc(user.uid).set({
        email: user.email,
        role: role,
      });

      alert('회원가입 성공! 이제 로그인해주세요.');
      onNavigate('login');

    } catch (err: any) {
      console.error("Signup Error:", err.code, err.message);
      let errorMessage = "회원가입에 실패했습니다. 다시 시도해주세요.";
      if (err.code === 'auth/email-already-in-use') {
          errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (err.code === 'auth/weak-password') {
          errorMessage = "비밀번호는 6자리 이상이어야 합니다.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-dark-accent p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            회원가입
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
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address-signup" className="sr-only">이메일 주소</label>
              <input id="email-address-signup" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-dark placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="이메일 주소" />
            </div>
            <div>
              <label htmlFor="password-signup" className="sr-only">비밀번호</label>
              <input id="password-signup" name="password" type="password" autoComplete="new-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-dark placeholder-gray-500 text-white focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="비밀번호 (6자리 이상)" />
            </div>
             <div>
              <label htmlFor="password-confirm" className="sr-only">비밀번호 확인</label>
              <input id="password-confirm" name="password-confirm" type="password" autoComplete="new-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-dark placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="비밀번호 확인" />
            </div>
          </div>
          
          <fieldset className="pt-2">
            <legend className="text-center text-sm font-medium text-gray-300 pb-2">가입 유형을 선택해주세요</legend>
            <div className="flex items-center justify-around bg-dark p-2 rounded-md">
                <label htmlFor="role-trainer" className="flex items-center cursor-pointer p-2 rounded-md hover:bg-dark-accent/50 w-1/2 justify-center">
                    <input id="role-trainer" name="role" type="radio" value="trainer" required className="focus:ring-primary h-4 w-4 text-primary border-gray-500 bg-dark" />
                    <span className="ml-3 block text-sm font-medium text-gray-200">🏋️ 트레이너</span>
                </label>
                <label htmlFor="role-member" className="flex items-center cursor-pointer p-2 rounded-md hover:bg-dark-accent/50 w-1/2 justify-center">
                    <input id="role-member" name="role" type="radio" value="member" required className="focus:ring-primary h-4 w-4 text-primary border-gray-500 bg-dark" />
                    <span className="ml-3 block text-sm font-medium text-gray-200">🙋‍♂️ 회원</span>
                </label>
            </div>
          </fieldset>

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary-dark disabled:bg-gray-500">
              {loading ? '가입 처리 중...' : '가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
