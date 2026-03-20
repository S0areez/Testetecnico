NEX.lab - Sistema de Ativação de Marketing

Projeto de captura de fotos com moldura personalizada e geração de QR Code, focado em alta fidelidade visual e controle de acesso baseado em funções (RBAC).
🚀 Links do Projeto

    Deploy (Vercel): https://testetecnico-two.vercel.app

    Repositório: [Link do seu GitHub aqui]

🛠️ Tecnologias Utilizadas

    Frontend: React.js + Tailwind CSS

    Backend/BaaS: Firebase (Auth, Firestore, Storage)

    Hospedagem: Vercel

🔑 Credenciais para Teste (RBAC)

O sistema redireciona o usuário automaticamente conforme o cargo (role) cadastrado no Firestore.
Perfil	E-mail	Senha	Acesso
Administrador	admin@email.com	123456	Dashboard de Métricas
Promotor	promotor@email.com	123456	Tela de Captura (Moldura)
⚙️ Como Rodar Localmente
1. Requisitos

    Node.js instalado (v18+)

    Gerenciador de pacotes (NPM ou Yarn)

2. Instalação

git clone https://github.com/S0areez/Testetecnico.git
cd Testetecnico
npm install

3. Variáveis de Ambiente

O projeto utiliza Firebase. Para rodar localmente, você deve:

    Renomear o arquivo .env.example para .env.local.

    Preencher com as suas credenciais do Firebase Console.

4. Execução
Bash

npm run dev