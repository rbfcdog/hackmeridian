"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"

export function StellarBenefitsSection() {
  const [counters, setCounters] = useState({ speed: 0, cost: 0, growth: 0, projects: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            animateCounters()
          }
        })
      },
      { threshold: 0.3 },
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [isVisible])

  const animateCounters = () => {
    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps

    let step = 0
    const interval = setInterval(() => {
      step++
      const progress = step / steps

      setCounters({
        speed: Math.floor(5 * progress),
        cost: Math.floor(0.01 * progress * 100) / 100,
        growth: Math.floor(33 * progress),
        projects: Math.floor(200 * progress),
      })

      if (step >= steps) clearInterval(interval)
    }, stepDuration)
  }

  const benefits = [
    {
      title: "Velocidade Incomparável",
      description:
        "Transações confirmadas em 3-5 segundos com finalidade instantânea. A rede Stellar processa milhares de transações por segundo.",
      stat: `${counters.speed}s`,
    },
    {
      title: "Custos Mínimos",
      description: "Taxas de transação extremamente baixas, tornando micropagamentos viáveis e acessíveis para todos.",
      stat: `$${counters.cost.toFixed(2)}`,
    },
    {
      title: "Alcance Global",
      description: "Conecte-se a uma rede global que facilita pagamentos transfronteiriços e inclusão financeira.",
      stat: "Global",
    },
    {
      title: "Crescimento Acelerado",
      description:
        "Em 2024, Stellar foi o 9º ecossistema que mais cresceu, com 33% de aumento em desenvolvedores e 500+ novos devs.",
      stat: `+${counters.growth}%`,
    },
  ]

  return (
    <section ref={sectionRef} className="py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-20">
          <h2 className="mb-6 text-4xl font-light tracking-tight lg:text-5xl text-gray-900">
            Por Que Stellar é o Futuro
          </h2>

          <p className="text-balance text-xl text-gray-600 leading-relaxed font-light">
            Nossa escolha pela rede Stellar não é coincidência. É a blockchain mais adequada para criar experiências de
            usuário excepcionais e democratizar o acesso às finanças digitais.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`transform transition-all duration-700 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <Card className="h-full border-0 bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-500 rounded-2xl">
                <CardHeader className="text-center">
                  <div className="text-3xl font-light text-gray-900 mb-4">{benefit.stat}</div>
                  <CardTitle className="text-lg font-medium text-gray-900">{benefit.title}</CardTitle>
                </CardHeader>

                <CardContent className="text-center">
                  <CardDescription className="text-sm leading-relaxed text-gray-600 font-light">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-3xl p-12 shadow-sm">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-medium text-gray-900 mb-6">Transformando o Ecossistema</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-light text-gray-900 mb-2">{counters.projects}+</div>
                <div className="text-sm text-gray-600">Projetos Financiados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-gray-900 mb-2">$17.4M</div>
                <div className="text-sm text-gray-600">Em Investimentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-gray-900 mb-2">500+</div>
                <div className="text-sm text-gray-600">Novos Desenvolvedores</div>
              </div>
            </div>

            <p className="text-center text-base text-gray-600 leading-relaxed font-light">
              Em 2024, mais de 200 projetos receberam $17.4 milhões em lumens através do Stellar Community Fund. O Talk
              To Stellar democratiza ainda mais esse acesso, permitindo que qualquer pessoa use blockchain através de
              uma simples conversa, eliminando barreiras técnicas e expandindo a adoção da rede.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
