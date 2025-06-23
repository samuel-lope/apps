/**
 * menubar.js
 *
 * Este script cria um menu lateral (sidebar) responsivo e o injeta em qualquer página
 * em que for chamado. O menu é configurável através de um array de objetos.
 * Tipos de item suportados: 'link', 'imagem', 'mensagem'.
 *
 * O script aceita parâmetros de URL para controlar a visibilidade dos itens:
 * - 'view': Mostra APENAS os itens especificados. Ex: menubar.js?view=item01,item02
 * - 'hide': Oculta os itens especificados (usado se 'view' não estiver presente). Ex: menubar.js?hide=item03
 */

// --- ÁREA DE CONFIGURAÇÃO ---
// Defina aqui os itens que aparecerão no seu menu.
// O parâmetro 'view' é um identificador único para cada item.
const menuItems = [
    {   tipo: 'imagem',
        src: 'https://img.shields.io/badge/APPs-Samuel_Lopes-blue?style=flat-square',
        url: 'index.html',
        alt: 'Logo do site',
        largura: '150px',
        view: 'fe873732'
    },
    {   tipo: 'link',
        texto: 'Página Inicial',
        url: 'index.html',
        view: 'fe873732'
    },
    {   tipo: 'link',
        texto: 'Criar Recibo',
        url: 'recibo.html',
        view: 'fe873732'
    },
    {   tipo: 'link',
        texto: 'QRCode PIX',
        url: 'pix.html',
        view: 'fe873732'
    },
    {   tipo: 'link',
        texto: 'Gerar Códigos',
        url: 'https://codegen.samuellopes.com.br',
        view: 'codeGen'
    },
    {   tipo: 'mensagem',
        texto: 'Mensagem de Teste',
        view: 'msgTeste'
    },
    {   tipo: 'mensagem',
        texto: '© Samuel Lopes - 2025',
        view: 'fe873732'
    },
    {   tipo: 'imagem',
        src: 'https://img.shields.io/badge/GitHub-%23181717?style=flat-square&logo=github',
        url: 'https://github.com/samuel-lope',
        alt: 'GitHub',
        largura: '70px',
        view: 'fe873732'
    }
];

// --- LÓGICA DO MENU (não é necessário editar daqui para baixo) ---

// Função para obter os parâmetros da URL do próprio script
function getScriptURLParams() {
    const script = document.currentScript;
    if (!script || !script.src) {
        return new URLSearchParams('');
    }
    const url = new URL(script.src);
    return url.searchParams;
}

// Captura os parâmetros da URL do script
const params = getScriptURLParams();
const itemsToShow = params.get('view')?.split(',');
const itemsToHide = params.get('hide')?.split(',') || [];

document.addEventListener('DOMContentLoaded', () => {
    let visibleMenuItems;

    // A lógica de 'view' (mostrar apenas) tem prioridade sobre 'hide' (ocultar).
    if (itemsToShow && itemsToShow.length > 0) {
        // Se 'view' existe, filtra para mostrar APENAS os itens da lista.
        visibleMenuItems = menuItems.filter(item => itemsToShow.includes(item.view));
    } else {
        // Se 'view' não existe, usa a lógica padrão de 'hide'.
        visibleMenuItems = menuItems.filter(item => !itemsToHide.includes(item.view));
    }

    // Se não houver itens visíveis, não renderiza o menu
    if (visibleMenuItems.length === 0) return;

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

    // 2. Popula a lista de itens com base na lista FILTRADA
    visibleMenuItems.forEach(item => {
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
    document.body.prepend(menuContainer);

    // 4. Cria e injeta o CSS necessário no <head> da página
    const styles = `
        /* Estilos de base para o container do menu */
        #menu-dinamico-container {}

        /* Ícone Hamburger */
        #menu-hamburger-icon {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 35px;
            height: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            cursor: pointer;
            z-index: 1001;
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
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            max-width: 80%;
            height: 100vh;
            background-color: #ffffff;
            box-shadow: 4px 0px 15px rgba(0, 0, 0, 0.1);
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            z-index: 1000;
            padding-top: 80px;
            display: flex;
            flex-direction: column;
        }
        #menu-sidebar-nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
            flex-grow: 1;
        }
        #menu-sidebar-nav a {
            display: block;
            padding: 10px 25px;
            color: #444;
            text-decoration: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 0.8rem;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
        }
        #menu-sidebar-nav a:hover {
            background-color: #f5f5f5;
        }

        /* Estilos para item de IMAGEM */
        .menu-item-imagem {
            padding: 20px 0;
            border-bottom: 1px solid #f0f0f0;
            text-align: center;
        }
        .menu-item-imagem a {
            padding: 0;
            border-bottom: none;
        }
        .menu-item-imagem img {
            max-width: 100%;
            height: auto;
            display: inline-block;
            vertical-align: middle;
        }
        
        /* Estilos para item de MENSAGEM */
        .menu-item-mensagem {
            padding: 20px 25px;
            text-align: center;
            margin-top: auto;
        }
        .menu-item-mensagem span {
            font-size: 0.8rem;
            color: #888;
        }

        /* Lógica de ativação do menu */
        #menu-dinamico-container.ativo #menu-sidebar-nav {
            transform: translateX(0);
        }
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

