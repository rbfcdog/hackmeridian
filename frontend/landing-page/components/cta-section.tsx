"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Users, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export function CTASection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.hasAttribute("data-card")) {
              const cardIndex = Number.parseInt(entry.target.getAttribute("data-card") || "0")
              setVisibleCards((prev) => [...prev, cardIndex].filter((v, i, a) => a.indexOf(v) === i))
            }
            if (entry.target.hasAttribute("data-section")) {
              setIsVisible(true)
            }
          }
        })
      },
      { threshold: 0.2 },
    )

    const cards = sectionRef.current?.querySelectorAll("[data-card]")
    const section = sectionRef.current?.querySelector("[data-section]")

    cards?.forEach((card) => observer.observe(card))
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="comece-sua-jornada"
      ref={sectionRef}
      className="bg-gradient-to-br from-gray-50 via-white to-gray-100 py-20 lg:py-32"
    >
      <div className="container mx-auto px-4">
        <div
          data-section
          className={`mx-auto max-w-4xl text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2 className="mb-4 text-3xl font-light tracking-tight lg:text-4xl text-gray-900">
            Comece Sua Jornada Stellar Agora
          </h2>
          <p className="text-balance text-lg text-gray-600 font-light leading-relaxed">
            Escolha sua plataforma favorita e comece a usar blockchain de forma natural. Sem instalações, sem
            configurações complexas - apenas conversas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div
            data-card={0}
            className={`transform transition-all duration-700 hover:scale-105 ${
              visibleCards.includes(0) ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <Card className="h-full flex flex-col group hover:shadow-xl transition-all duration-500 border-0 bg-white rounded-2xl overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-800 group-hover:text-white transition-all duration-500 group-hover:scale-110">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                  WhatsApp Chat
                </h3>
                <p className="mb-6 flex-1 text-gray-600 font-light leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Use blockchain através do app de mensagens mais popular do Brasil. Interface familiar e intuitiva.
                </p>
                <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white transition-all duration-300 hover:scale-105 active:scale-95 rounded-full py-3 cursor-pointer">
                  Ir para o Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          <div
            data-card={1}
            className={`transform transition-all duration-700 hover:scale-105 ${
              visibleCards.includes(1) ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <Card className="h-full flex flex-col group hover:shadow-xl transition-all duration-500 border-0 bg-white rounded-2xl overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-800 group-hover:text-white transition-all duration-500 group-hover:scale-110">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                  Discord Bot
                </h3>
                <p className="mb-6 flex-1 text-gray-600 font-light leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Integre blockchain aos seus servidores Discord. Perfeito para comunidades e gamers.
                </p>
                <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white transition-all duration-300 hover:scale-105 active:scale-95 rounded-full py-3 cursor-pointer">
                  TalkToStellar Discord
                </Button>
              </CardContent>
            </Card>
          </div>

          <div
            data-card={2}
            className={`transform transition-all duration-700 hover:scale-105 ${
              visibleCards.includes(2) ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <Card className="h-full flex flex-col group hover:shadow-xl transition-all duration-500 border-0 bg-white rounded-2xl overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-800 group-hover:text-white transition-all duration-500 group-hover:scale-110">
                    <Send className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                  Telegram Bot
                </h3>
                <p className="mb-6 flex-1 text-gray-600 font-light leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Acesse funcionalidades avançadas através do Telegram. Comandos rápidos e notificações em tempo real.
                </p>
                <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white transition-all duration-300 hover:scale-105 active:scale-95 rounded-full py-3 cursor-pointer">
                  TalkToStellar Telegram
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          className={`text-center transform transition-all duration-1000 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-500 border border-gray-100">
            <h3 className="mb-4 text-2xl font-light text-gray-900">Desenvolvido no Hackathon</h3>
            <p className="text-gray-600 leading-relaxed mb-6 font-light">
              Criado durante o HackMeridian Rio de Janeiro 2025, o Talk To Stellar representa 36 horas de inovação
              intensa para democratizar o acesso à blockchain Stellar e acelerar a adoção de tecnologias
              descentralizadas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-300 cursor-default">
                Inovação
              </span>
              <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-300 cursor-default">
                Velocidade
              </span>
              <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-300 cursor-default">
                Simplicidade
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
