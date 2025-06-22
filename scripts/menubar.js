/**
 * menu.js
 *
 * Este script cria um menu lateral (sidebar) responsivo e o injeta em qualquer página
 * em que for chamado. O menu é configurável através de um array de objetos.
 * Tipos de item suportados: 'link', 'imagem', 'mensagem'.
 */

// --- ÁREA DE CONFIGURAÇÃO ---
// Defina aqui os itens que aparecerão no seu menu.
// - { tipo: 'link', texto: '...', url: '...' } -> Item de navegação padrão.
// - { tipo: 'imagem', src: '...', url: '...', alt: '...', largura: '150px' } -> Imagem clicável (logo). O parâmetro 'largura' é opcional.
// - { tipo: 'mensagem', texto: '...' } -> Texto simples para notas ou copyright.
const menuItems = [
    { tipo: 'imagem', src: 'https://img.shields.io/badge/APPs-Samuel_Lopes-blue?style=flat-square', url: 'index.html', alt: 'Logo do site', largura: '150px' },
    { tipo: 'link', texto: 'Página Inicial', url: 'index.html' },
    { tipo: 'link', texto: 'QRCode PIX', url: 'pix.html' },
    { tipo: 'mensagem', texto: '© Samuel Lopes - 2025' },
    { tipo: 'imagem', src: 'https://img.shields.io/badge/GitHub-%23181717?style=flat-square&logo=github', url: 'https://github.com/samuel-lope', alt: 'GitHub', largura: '70px'}
];

// --- LÓGICA DO MENU (não é necessário editar daqui para baixo) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cria os elementos HTML que compõem o menu
    const menuContainer = document.createElement('div');
    menuContainer.id = 'menu-dinamico-container';

    // Ícone "Hamburger"
    const hamburgerIcon = document.createElement('div');
    hamburgerIcon.id = 'menu-hamburger-icon';
    hamburgerIcon.innerHTML = '<span></span><span></span><span></span>';

    // Barra lateral (Sidebar)
    const sidebar = document.createElement('nav');
    sidebar.id = 'menu-sidebar-nav';

    const linkList = document.createElement('ul');

    // 2. Popula a lista de itens com base na configuração, tratando cada tipo
    menuItems.forEach(item => {
        const listItem = document.createElement('li');

        switch (item.tipo) {
            case 'link':
                const link = document.createElement('a');
                link.textContent = item.texto;
                link.href = item.url;
                listItem.appendChild(link);
                break;

            case 'imagem':
                const imgLink = document.createElement('a');
                imgLink.href = item.url;

                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.alt || 'Imagem do menu';

                // NOVO: Aplica a largura customizada se ela for definida
                if (item.largura) {
                    img.style.width = item.largura;
                }
                
                imgLink.appendChild(img);
                listItem.appendChild(imgLink);
                listItem.classList.add('menu-item-imagem');
                break;

            case 'mensagem':
                const message = document.createElement('span');
                message.textContent = item.texto;
                listItem.appendChild(message);
                listItem.classList.add('menu-item-mensagem');
                break;
        }

        linkList.appendChild(listItem);
    });

    // 3. Monta a estrutura final do menu
    sidebar.appendChild(linkList);
    menuContainer.appendChild(hamburgerIcon);
    menuContainer.appendChild(sidebar);

    // Adiciona o menu completo ao <body> da página
    document.body.prepend(menuContainer); // .prepend para garantir que seja um dos primeiros elementos

    // 4. Cria e injeta o CSS necessário no <head> da página
    const styles = `
        /* Estilos de base para o container do menu */
        #menu-dinamico-container {
            /* Este container gerencia o estado 'ativo' */
        }

        /* Ícone Hamburger */
        #menu-hamburger-icon {
            position: fixed; /* Fixo na tela */
            top: 20px;
            left: 20px;
            width: 35px;
            height: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            cursor: pointer;
            z-index: 1001; /* Deve ficar sobre a barra lateral */
        }

        #menu-hamburger-icon span {
            display: block;
            width: 100%;
            height: 4px;
            background-color: #333;
            border-radius: 2px;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }

        /* Barra Lateral (Sidebar) */
        #menu-sidebar-nav {
            position: fixed; /* Fica por cima de todo o conteúdo */
            top: 0;
            left: 0;
            width: 280px;
            max-width: 80%; /* Garante que não ocupe a tela toda em dispositivos pequenos */
            height: 100vh; /* Altura total da tela */
            background-color: #ffffff;
            box-shadow: 4px 0px 15px rgba(0, 0, 0, 0.1);
            transform: translateX(-100%); /* Começa escondida para a esquerda */
            transition: transform 0.3s ease-in-out;
            z-index: 1000;
            padding-top: 80px; /* Espaço para os links não ficarem sob o ícone */
            display: flex;
            flex-direction: column;
        }

        #menu-sidebar-nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
            flex-grow: 1; /* Faz a lista de links crescer */
        }

        #menu-sidebar-nav a {
            display: block;
            padding: 18px 25px;
            color: #444;
            text-decoration: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 1.1rem;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
        }

        #menu-sidebar-nav a:hover {
            background-color: #f5f5f5;
        }

        /* Estilos para item de IMAGEM */
        .menu-item-imagem {
            padding: 20px 0; /* Espaçamento vertical */
            border-bottom: 1px solid #f0f0f0;
            text-align: center; /* Centraliza o link da imagem */
        }
        .menu-item-imagem a {
            padding: 0; /* Remove padding do link da imagem */
            border-bottom: none;
        }
        .menu-item-imagem img {
            max-width: 100%; /* Garante que a imagem nunca ultrapasse a largura do menu */
            height: auto;
            display: inline-block; /* Permite centralização */
            vertical-align: middle;
        }
        
        /* Estilos para item de MENSAGEM */
        .menu-item-mensagem {
            padding: 20px 25px;
            text-align: center;
            margin-top: auto; /* Empurra a mensagem para o final */
        }
        .menu-item-mensagem span {
            font-size: 0.8rem;
            color: #888;
        }

        /* Lógica de ativação do menu */
        #menu-dinamico-container.ativo #menu-sidebar-nav {
            transform: translateX(0); /* Move a sidebar para a visão */
        }

        /* Animação do ícone para um 'X' quando o menu está ativo */
        #menu-dinamico-container.ativo #menu-hamburger-icon span:nth-child(1) {
            transform: rotate(45deg) translate(8px, 8px);
        }

        #menu-dinamico-container.ativo #menu-hamburger-icon span:nth-child(2) {
            opacity: 0;
        }

        #menu-dinamico-container.ativo #menu-hamburger-icon span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 5. Adiciona o evento de clique para abrir/fechar o menu
    hamburgerIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        menuContainer.classList.toggle('ativo');
    });

    // Opcional: fechar o menu ao clicar fora dele
    document.addEventListener('click', (e) => {
        if (menuContainer.classList.contains('ativo') && !sidebar.contains(e.target)) {
            menuContainer.classList.remove('ativo');
        }
    });
});

