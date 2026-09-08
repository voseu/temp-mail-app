export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 mt-auto bg-[#0a0a0a] py-10 flex flex-col items-center">
      <div className="max-w-[700px] w-full px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h2
              className="text-lg font-black text-white tracking-widest"
              style={{ fontFamily: "'Akkolotm', sans-serif" }}
            >
              WHISEMAIL
            </h2>
          </div>
          <p className="text-sm text-zinc-500">
            Terima OTP dari emailmu — Bagian dari Ekosistem Whisemart.
          </p>
          <p className="text-xs text-zinc-600 font-medium mt-2">
            &copy; {new Date().getFullYear()} Whisemart. Hak Cipta Dilindungi.
          </p>
        </div>
        <div className="flex gap-5 text-sm font-bold text-zinc-400 mt-2 md:mt-0">
          <a
            href="https://whise.fun"
            className="hover:text-white transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Whisemart
          </a>
          <a
            href="https://whise.fun/tutorial"
            className="hover:text-blue-500 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bantuan
          </a>
        </div>
      </div>
    </footer>
  );
}
