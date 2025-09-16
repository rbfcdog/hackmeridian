// src/components/chat-sidebar.tsx

"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MoreVertical, MessageCircle, Users } from "lucide-react";

interface ChatSidebarProps {
  selectedChat: string | null;
  onSelectChat: (chatId: string | null) => void;
}

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const conversations = [
    {
      id: "stellar-bot",
      title: "TalkToStellar",
      lastMessage: "Olá! Como posso ajudá-lo hoje?",
      lastMessageTime: new Date().toISOString(),
      avatar: "/stellar-logo.png",
      isBot: true,
    },
    {
      id: "user-1",
      title: "CryptoAna",
      lastMessage: "Acabei de comprar um novo NFT!",
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      avatar: "/crypto-punk-nft-avatar-digital-art.jpg",
    },
    {
      id: "user-2",
      title: "BitcoinBruno",
      lastMessage: "Bitcoin está subindo! 🚀",
      lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
      avatar: "/bitcoin-logo-cryptocurrency-golden.jpg",
    },
    {
      id: "user-3",
      title: "NFTCarla",
      lastMessage: "Minha coleção está crescendo!",
      lastMessageTime: new Date(Date.now() - 10800000).toISOString(),
      avatar: "/colorful-nft-art-digital-collectible.jpg",
    },
    {
      id: "user-4",
      title: "EthereumDiego",
      lastMessage: "Smart contracts são o futuro",
      lastMessageTime: new Date(Date.now() - 14400000).toISOString(),
      avatar: "/ethereum-logo-cryptocurrency-purple.jpg",
    },
    {
      id: "user-5",
      title: "DeFiEduarda",
      lastMessage: "Yield farming está rendendo bem!",
      lastMessageTime: new Date(Date.now() - 18000000).toISOString(),
      avatar: "/defi-cryptocurrency-finance-digital.jpg",
    },
    {
      id: "user-6",
      title: "MetaverseFelipe",
      lastMessage: "Comprei um terreno virtual",
      lastMessageTime: new Date(Date.now() - 21600000).toISOString(),
      avatar: "/metaverse-virtual-world-digital-land.jpg",
    },
    {
      id: "user-7",
      title: "CryptoGabi",
      lastMessage: "Altcoins estão em alta!",
      lastMessageTime: new Date(Date.now() - 25200000).toISOString(),
      avatar: "/cryptocurrency-altcoin-digital-money.jpg",
    },
    {
      id: "user-8",
      title: "BlockchainHenrique",
      lastMessage: "Tecnologia revolucionária",
      lastMessageTime: new Date(Date.now() - 28800000).toISOString(),
      avatar: "/blockchain-technology-digital-chain.jpg",
    },
    {
      id: "user-9",
      title: "TokenIsabela",
      lastMessage: "Meus tokens estão valorizando!",
      lastMessageTime: new Date(Date.now() - 32400000).toISOString(),
      avatar: "/crypto-token-digital-currency.jpg",
    },
    {
      id: "user-10",
      title: "Web3João",
      lastMessage: "O futuro é descentralizado",
      lastMessageTime: new Date(Date.now() - 36000000).toISOString(),
      avatar: "/web3-decentralized-internet-future.jpg",
    },
  ];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  
  const filteredConversations = conversations.filter(
    (chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed left-0 top-0 h-full w-[400px] flex flex-col bg-[#111b21] border-r border-[#313d45]">
      <div className="flex items-center justify-between px-4 py-4 bg-[#202c33]">
        <h1 className="text-[#e9edef] text-[19px] font-bold">StellarWhatsApp</h1>
        <div className="flex items-center gap-5 text-[#aebac1]"><Users className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><MoreVertical className="h-5 w-5" /></div>
      </div>
      <div className="px-3 py-3 bg-[#0b141a]">
        <div className="relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" /><Input placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-4 py-2 bg-[#202c33] border-none rounded-lg h-9" /></div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0">
          {filteredConversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#202c33] border-b border-[#313d45]/20 ${
                selectedChat === chat.id ? "bg-[#2a3942]" : ""
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback className={chat.isBot ? "bg-[#00a884]" : "bg-[#6b7280]"}>
                  {chat.title.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <h3 className="font-normal text-[#e9edef] truncate text-[17px]">{chat.title}</h3>
                  <span className="text-xs text-[#8696a0]">{formatTime(chat.lastMessageTime)}</span>
                </div>
                <p className="text-sm text-[#8696a0] truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}