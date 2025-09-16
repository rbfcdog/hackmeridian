"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef, useState } from "react"

export function ExamplesSection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = Number.parseInt(entry.target.getAttribute("data-example") || "0")
            setVisibleCards((prev) => [...prev, cardIndex].filter((v, i, a) => a.indexOf(v) === i))
          }
        })
      },
      { threshold: 0.2 },
    )

    const cards = sectionRef.current?.querySelectorAll("[data-example]")
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  const examples = [
    {
      title: "Criando uma Carteira",
      user: "Oi! Preciso criar uma carteira Stellar",
      bot: "Perfeito! Criei uma nova carteira para você:\n\nEndereço: GAXXX...XXXX\nSaldo: 0 XLM\n\nSua chave privada foi enviada de forma segura. Gostaria de fazer um depósito inicial?",
      platform: "WhatsApp",
    },
    {
      title: "Transferindo Fundos",
      user: "Quero enviar 50 XLM para o João",
      bot: 'Encontrei o contato João (GBYYY...YYYY).\n\nTransferência: 50 XLM\nPara: João\nTaxa: 0.00001 XLM\n\nConfirmar transferência? Digite "sim" para prosseguir.',
      platform: "Discord",
    },
    {
      title: "Verificando Saldo",
      user: "/saldo",
      bot: "Seu saldo atual:\n\n• 1,250.50 XLM\n• 500 USDC\n• 0.25 BTC (via anchor)\n\nValor total: ~$890 USD\n\nPrecisa de mais alguma coisa?",
      platform: "Telegram",
    },
    {
      title: "Criando Contrato",
      user: "Criar contrato para vender meu carro por 5000 XLM",
      bot: "Contrato criado com sucesso!\n\nItem: Carro\nValor: 5,000 XLM\nID: CONTRACT_ABC123\n\nO comprador pode assinar digitando: /assinar CONTRACT_ABC123\n\nLink para compartilhar: stellar.link/ABC123",
      platform: "WhatsApp",
    },
  ]

  const platformColors = {
    WhatsApp: "bg-gray-700",
    Discord: "bg-gray-700",
    Telegram: "bg-gray-700",
  }

  return (
    <section ref={sectionRef} className="py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4 text-4xl font-light tracking-tight lg:text-5xl text-gray-900">Veja Como é Simples</h2>
          <p className="text-balance text-xl text-gray-600 font-light leading-relaxed">
            Exemplos reais de como nossos usuários interagem com a blockchain Stellar através de conversas naturais em
            suas plataformas favoritas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
          {examples.map((example, index) => (
            <div
              key={index}
              data-example={index}
              className={`transform transition-all duration-700 ${
                visibleCards.includes(index) ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <Card className="overflow-hidden border-0 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-gray-900">{example.title}</CardTitle>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white ${platformColors[example.platform as keyof typeof platformColors]}`}
                    >
                      {example.platform}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-gray-900 px-4 py-3 text-white">
                      <p className="text-sm font-light">{example.user}</p>
                    </div>
                  </div>

                  {/* Bot response */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-700">Talk To Stellar</span>
                      </div>
                      <p className="text-sm whitespace-pre-line text-gray-800 font-light">{example.bot}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
