import LoginForm from '@/components/admin/LoginForm';
import Logo from '@/components/Logo';

export default function LoginPage() {
  return (
    <main data-theme="dark" className="grid min-h-screen place-items-center bg-[#140D0E] px-4 text-[#F3EBE0]">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo variant="mark" width={72} tone="night" />
          <p className="micro-caps m-0 text-[#C2B3A8]">Adyssey · Content studio</p>
          <h1 className="m-0 text-[34px] leading-[1.1]">
            Welcome <span className="serif-accent">back</span>
          </h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
