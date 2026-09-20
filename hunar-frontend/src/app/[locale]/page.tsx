import { RoleModalProvider } from "@/components/landing/role-modal";
import { TopUtilityBar } from "@/components/landing/top-utility-bar";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { RatedProfessionals } from "@/components/landing/rated-professionals";
import { PopularServices } from "@/components/landing/popular-services";
import { ValueProp } from "@/components/landing/value-prop";
import { TrustedBrands } from "@/components/landing/trusted-brands";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer, PreFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 text-slate-800 antialiased selection:bg-[#5BBB7B] selection:text-white landing-fade-in flex flex-col">
      <RoleModalProvider>
        <TopUtilityBar />
        <Header />
        <main className="w-full flex-1 flex flex-col">
          <Hero />
          <Features />
          <RatedProfessionals />
          <PopularServices />
          <ValueProp />
          <TrustedBrands />
          <Testimonials />
        </main>
        <PreFooter />
        <Footer />
      </RoleModalProvider>
    </div>
  );
}