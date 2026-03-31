import Link from "next/link";
import { getServerSession } from "next-auth";

export default async function LandingPage() {
  const session = await getServerSession();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold text-indigo-900 tracking-tight">
          Manage Your Tasks <span className="text-indigo-600">Effortlessly</span>
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          A production-ready, highly responsive Task Management System engineered for zero-friction workflows and productivity.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          {session ? (
            <Link href="/dashboard" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
