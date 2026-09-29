import { setRequestLocale } from "next-intl/server";
import { CustomerChatView } from "@/features/chat/components/customer-chat-view";

export async function generateMetadata() {
  return {
    title: "Live Chat & Voice Notes — WorkerFIX Customer Hub",
    description: "Send direct text messages and voice notes to your assigned technicians in Peshawar.",
  };
}

export default async function CustomerChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerChatView />;
}
