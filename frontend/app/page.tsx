import Image from "next/image";
import LoginForm from "../components/LoginForm/LoginForm";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <Image
          className="dark:invert"
          src="/nock.ing.png"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <div className="w-full max-w-md p-8 bg-white dark:bg-black/[.05] rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-8">Login</h1>
          <LoginForm />
        </div>

      </main>
      <footer className="row-start-3 text-sm text-center text-gray-500">
        Created by {' '}
          Nock.ing
      </footer>
    </div>
  );
}
