export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="mb-4 text-2xl font-bold">Talk To Stellar</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Democratizando o acesso à blockchain Stellar através de conversas naturais. Desenvolvido com ❤️ no
              HackMeridian Rio 2025.
            </p>
            <div className="flex gap-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-gray-800 text-white">AI-Powered</span>
              <span className="px-3 py-1 rounded-full bg-gray-700 text-white">Stellar Network</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Plataformas</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>WhatsApp Chat</li>
              <li>Discord Bot</li>
              <li>Telegram Bot</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Funcionalidades</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Criar Carteiras</li>
              <li>Transferir Fundos</li>
              <li>Contratos Inteligentes</li>
              <li>Consultar Saldos</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Talk To Stellar. Desenvolvido durante o HackMeridian Rio de Janeiro.</p>
          <p className="mt-2">Powered by Stellar Network • Built with Next.js</p>
        </div>
      </div>
    </footer>
  )
}
