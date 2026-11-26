import { Link } from 'react-router';

interface HomeCard {
  title: string;
  description: string;
  to?: string;
  href?: string;
  bgColor: string;
  textColor: string;
  image: string;
}

const HOME_CARDS: HomeCard[] = [
  {
    title: 'Criar Recibo',
    description: 'Crie recibos de forma rápida.',
    to: '/apps/recibo',
    bgColor: '#c7d2fe',
    textColor: '#1e1b4b',
    image: '/assets/recibo.png',
  },
  {
    title: 'QrCode PIX',
    description: 'Crie uma placa de QrCode PIX para impressão.',
    to: '/apps/pix',
    bgColor: '#fde68a',
    textColor: '#78350f',
    image: '/assets/pix.png',
  },
  {
    title: 'Gerador de Códigos',
    description: 'Gere códigos e senhas de forma fácil e rápida.',
    to: '/apps/codegen',
    bgColor: '#d1d5db',
    textColor: '#1f2937',
    image: '/assets/codigo-qr.png',
  },
  {
    title: 'GitHub',
    description: 'Veja os códigos abertos no GitHub.',
    href: 'https://github.com/samuel-lope',
    bgColor: '#a7f3d0',
    textColor: '#064e3b',
    image: '/assets/github.png',
  },
];

const CARD_CLASS =
  'flex flex-col rounded-[16px] overflow-hidden no-underline shadow-[0_4px_6px_rgba(0,0,0,0.05)] hover:-translate-y-[5px] hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)] transition-all duration-200';

function CardInner({ card }: { card: HomeCard }) {
  return (
    <>
      <div className="pt-5 px-5 flex justify-center">
        <img
          src={card.image}
          alt={card.title}
          className="h-[60px] w-full object-contain"
        />
      </div>
      <div
        className="px-5 pb-5 pt-[15px] flex-1 text-left"
        style={{ color: card.textColor }}
      >
        <h2 className="text-[1.1rem] font-bold m-0 mb-2 leading-snug">{card.title}</h2>
        <p className="text-[0.9rem] m-0 leading-snug">{card.description}</p>
      </div>
    </>
  );
}

export function HomePage() {
  return (
    <div className="font-ubuntu min-h-screen flex flex-col items-center px-5 box-border">
      <div className="text-center mt-[70px] sm:mt-[80px] mb-[40px] flex items-end justify-center">
        <h1 className="text-[1.8rem] sm:text-[2rem] font-bold leading-none m-0">
          Samuel Lopes
        </h1>
        <span
          className="inline-block w-[30px] h-[5px] ml-[10px] mb-[2px] bg-[#333333] dark:bg-[#f0f0f0] portal-cursor"
          aria-hidden="true"
        />
      </div>

      <section
        aria-label="Aplicações principais"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-[920px] mt-[30px]"
      >
        {HOME_CARDS.map((card) =>
          card.to ? (
            <Link
              key={card.title}
              to={card.to}
              className={CARD_CLASS}
              style={{ backgroundColor: card.bgColor }}
            >
              <CardInner card={card} />
            </Link>
          ) : (
            <a
              key={card.title}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={CARD_CLASS}
              style={{ backgroundColor: card.bgColor }}
            >
              <CardInner card={card} />
            </a>
          ),
        )}
      </section>

      <footer className="w-full mt-auto pt-10 pb-5 flex flex-col items-center gap-3 text-center">
        <iframe
          src="https://github.com/sponsors/samuel-lope/button"
          title="Sponsor samuel-lope"
          height={30}
          width={140}
          className="border-0 rounded-[3px]"
        />
        <img
          src="https://img.shields.io/badge/%C2%A9_Samuel_Lopes-2025-blue?style=flat-square"
          alt="© Samuel Lopes 2025"
        />
      </footer>
    </div>
  );
}
