"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef, useState } from "react"

export function AboutSection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const [visibleStats, setVisibleStats] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.hasAttribute("data-card")) {
              const cardIndex = Number.parseInt(entry.target.getAttribute("data-card") || "0")
              setVisibleCards((prev) => [...prev, cardIndex].filter((v, i, a) => a.indexOf(v) === i))
            }
            if (entry.target.hasAttribute("data-stats")) {
              setVisibleStats(true)
            }
          }
        })
      },
      { threshold: 0.2 },
    )

    const cards = sectionRef.current?.querySelectorAll("[data-card]")
    const stats = statsRef.current

    cards?.forEach((card) => observer.observe(card))
    if (stats) observer.observe(stats)

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      title: "AI Agent Inteligente",
      description:
        "Nosso AI Agent entende linguagem natural e executa operações blockchain complexas através de conversas simples.",
    },
    {
      title: "Criação de Carteiras",
      description:
        "Crie carteiras Stellar instantaneamente apenas pedindo ao nosso bot. Seguro, rápido e sem complicações.",
    },
    {
      title: "Transferências Instantâneas",
      description: 'Envie XLM e outros tokens Stellar para qualquer pessoa simplesmente dizendo "enviar X para João".',
    },
    {
      title: "Contratos Inteligentes",
      description: "Crie e gerencie contratos de transferência que podem ser assinados e executados automaticamente.",
    },
    {
      title: "Multi-Plataforma",
      description: "Disponível no WhatsApp, Discord e Telegram. Use onde você já conversa com seus amigos.",
    },
    {
      title: "Interface Familiar",
      description: "Não precisa aprender interfaces complexas. Use blockchain como se fosse uma conversa normal.",
    },
  ]

  return (
    <section id="como-funciona" ref={sectionRef} className="py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-20">
          <h2 className="mb-6 text-4xl font-light tracking-tight lg:text-5xl text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Como Funciona
          </h2>

          <p className="text-balance text-xl text-gray-600 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Revolucionamos a forma como você interage com blockchain. Nossa tecnologia combina inteligência artificial
            avançada com a velocidade e segurança da rede Stellar.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              data-card={index}
              className={`transform transition-all duration-700 hover:scale-105 ${
                visibleCards.includes(index) ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <Card className="h-80 flex flex-col border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl group cursor-default">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-medium text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1">
                  <CardDescription className="text-base leading-relaxed text-gray-600 font-light group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-24" ref={statsRef} data-stats>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { number: "3-5s", label: "Tempo de Transação", delay: "delay-100" },
              { number: "100%", label: "Segurança Garantida", delay: "delay-300" },
              { number: "24/7", label: "Disponibilidade", delay: "delay-500" },
            ].map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-700 hover:scale-105 ${
                  visibleStats ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                } ${stat.delay}`}
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-500 group cursor-default">
                  <div className="text-4xl font-light text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium group-hover:text-gray-700 transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
