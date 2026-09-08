import { SignIn } from "@clerk/nextjs";

export default function PartnerPage() {
  return (
    <div className="-mt-20 pt-20 flex-1 flex items-center justify-center p-6 relative overflow-hidden min-h-screen">
      {/* Ambient glow orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600 opacity-15 blur-[120px] pointer-events-none -top-[100px] -right-[80px] animate-[partnerFloat_8s_ease-in-out_infinite]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-600 opacity-15 blur-[120px] pointer-events-none -bottom-[80px] -left-[60px] animate-[partnerFloat_10s_ease-in-out_infinite_reverse]" />

      <div className="flex flex-col items-center gap-6 w-full max-w-[440px] relative z-10">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-200 mb-1.5">Partner Access</h2>
        </div>

        {/* Clerk sign-in wrapper */}
        <div className="w-full flex justify-center rounded-2xl overflow-hidden bg-white/2 border border-white/6 shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
          <SignIn routing="hash" forceRedirectUrl="/" />
        </div>
      </div>
    </div>
  );
}
