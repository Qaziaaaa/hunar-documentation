"use client";
import { useParams } from "next/navigation";
import { ChatScreen } from "@/components/worker/chat-screen";
export default function ConversationPage() { const { conversationId } = useParams<{ conversationId: string }>(); return <ChatScreen conversationId={conversationId} />; }