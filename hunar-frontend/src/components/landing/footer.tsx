import { Link } from "@/i18n/navigation";
import { footerColumns } from "./data";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

const socialIcons = [
  {
    ariaLabel: "Facebook",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    ariaLabel: "Twitter",
    path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z",
  },
  {
    ariaLabel: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z",
  },
  {
    ariaLabel: "LinkedIn",
    path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
  },
];

export function PreFooter() {
  return (
    <section
      className="bg-brand-top text-white border-t border-brand-topborder relative overflow-hidden py-12"
      data-purpose="pre-footer-cta"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="inline-block px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-semibold mb-3 tracking-wider uppercase">
          Fast & Guaranteed Service
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">
          Ready to get skilled work done in Peshawar?
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          Post your requirements today to receive quotes in minutes, or
          register as a certified artisan to expand your craft business.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            className="inline-flex items-center px-7 py-3 rounded-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-sm shadow-lg transition-all duration-200"
            href="#services"
          >
            Post a Job
          </a>
          <Link
            href="/worker/sign-in"
            className="inline-flex items-center px-7 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all duration-200"
          >
            Register as Professional
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer
      className="bg-brand-herodark text-slate-300 pt-16 pb-12 border-t border-brand-topborder"
      data-purpose="marketplace-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between pb-10 border-b border-white/10 gap-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <OrderworkerLogo variant="light" size="sm" />
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
            <span className="text-slate-400">
              Terms of Service
            </span>
            <span className="text-slate-400">
              Privacy Policy
            </span>
            <Link
              href="/customer/dashboard"
              className="hover:text-white transition"
            >
              My Jobs Hub
            </Link>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="text-xs font-medium text-slate-300">
              Follow Us:
            </span>
            {socialIcons.map((icon) => (
              <span
                key={icon.ariaLabel}
                aria-label={icon.ariaLabel}
                className="hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d={icon.path} />
                </svg>
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-xs">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-bold text-white mb-4">
                {column.title}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a className="hover:text-white transition" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Subscribe</h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Get seasonal home maintenance checklists & promo discount codes.
            </p>
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15">
              <input
                className="bg-transparent border-0 text-white placeholder-slate-400 text-xs px-2 py-1.5 focus:ring-0 w-full"
                placeholder="Your email address"
                type="email"
              />
              <button className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                Send
              </button>
            </div>
            <div className="mt-5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Apps
              </span>
              <div className="flex items-center space-x-2 text-[11px] text-slate-200">
                <span className="px-2.5 py-1 rounded bg-white/10 border border-white/10 hover:bg-white/20 transition cursor-pointer">
                  iOS App
                </span>
                <span className="px-2.5 py-1 rounded bg-white/10 border border-white/10 hover:bg-white/20 transition cursor-pointer">
                  Android App
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Orderworker Technologies Inc. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>PKR (₨)</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full" />
            <span>English (US)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}