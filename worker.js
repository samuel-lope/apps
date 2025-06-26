
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 })
  }

  const url = new URL(request.url)
  if (url.pathname !== '/worker/recibo') {
    return new Response('Endpoint não encontrado', { status: 404 })
  }

  try {
    const data = await request.json()
    const html = gerarHTMLRecibo(data)
    
    const response = {
      result: html
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response('Erro ao processar a solicitação: ' + error.message, { status: 400 })
  }
}

function formatarValorParaExibicao(valor) {
    if (!valor) return '0,00';
    valor = valor.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function valorPorExtenso(valor) {
    if (!valor) return 'zero reais';
    
    valor = valor.toString().replace(/\./g, '').replace(',', '.');
    valor = parseFloat(valor);
    
    if (isNaN(valor)) return 'valor inválido';
    
    const parteInteira = Math.floor(valor);
    const parteDecimal = Math.round((valor - parteInteira) * 100);
    
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dezADezenove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    
    function converterGrupo(numero) {
        if (numero === 0) return '';
        if (numero === 100) return 'cem';
        if (numero < 10) return unidades[numero];
        if (numero < 20) return dezADezenove[numero - 10];
        if (numero < 100) {
            const dezena = Math.floor(numero / 10);
            const unidade = numero % 10;
            return dezenas[dezena] + (unidade ? ' e ' + unidades[unidade] : '');
        }
        const centena = Math.floor(numero / 100);
        const resto = numero % 100;
        return centenas[centena] + (resto ? ' e ' + converterGrupo(resto) : '');
    }
    
    function converterNumeroCompleto(numero) {
        if (numero === 0) return 'zero';
        
        const grupos = [];
        const nomesGrupos = ['', 'mil', 'milhão', 'bilhão', 'trilhão'];
        const nomesGruposPlural = ['', 'mil', 'milhões', 'bilhões', 'trilhões'];
        
        let resultado = '';
        
        let numeroStr = String(numero);
        while (numeroStr.length > 0) {
            const tamanho = Math.min(3, numeroStr.length);
            grupos.unshift(parseInt(numeroStr.substring(numeroStr.length - tamanho)));
            numeroStr = numeroStr.substring(0, numeroStr.length - tamanho);
        }
        
        for (let i = 0; i < grupos.length; i++) {
            const valor = grupos[i];
            const posicao = grupos.length - 1 - i;
            
            if (valor !== 0) {
                const nomeGrupo = valor === 1 && posicao !== 0 ? nomesGrupos[posicao] : nomesGruposPlural[posicao];
                
                if (resultado !== '') {
                    if (valor < 100) {
                        resultado += ' e ';
                    } else {
                        const proximoGrupoTemValor = grupos.slice(i + 1).some(g => g !== 0);
                        resultado += proximoGrupoTemValor ? ', ' : ' e ';
                    }
                }
                
                resultado += converterGrupo(valor);
                if (nomeGrupo !== '') {
                    resultado += ' ' + nomeGrupo;
                }
            }
        }
        
        return resultado;
    }
    
    let extenso = '';
    
    if (parteInteira === 0 && parteDecimal === 0) {
        return 'zero reais';
    }
    
    if (parteInteira > 0) {
        extenso = converterNumeroCompleto(parteInteira);
        extenso += parteInteira === 1 ? ' real' : ' reais';
    }
    
    if (parteDecimal > 0) {
        if (parteInteira > 0) {
            extenso += ' e ';
        }
        
        if (parteDecimal === 1) {
            extenso += 'um centavo';
        } else {
            extenso += converterGrupo(parteDecimal) + ' centavos';
        }
    }
    
    return extenso;
}

function gerarHTMLRecibo(data) {
    const {
        nomePagador,
        cpfPagador,
        enderecoPagador,
        nomeRecebedor,
        cpfRecebedor,
        enderecoRecebedor,
        valor,
        referente,
        formaPagamento,
        data: dataPagamento,
        cidade,
        observacoes
    } = data;

    const dataObj = new Date(dataPagamento);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');

    const numeroRecibo = new Date().getTime().toString().slice(-8);

    const valorFormatado = formatarValorParaExibicao(valor);
    const valorExtenso = valorPorExtenso(valor);

    let html = `
        <div class="preview-header">
            <h1 class="preview-title">Recibo</h1>
            <div class="preview-number">Nº ${numeroRecibo}</div>
        </div>
        
        <div class="preview-value">R$ ${valorFormatado}</div>
        
        <div class="preview-text">
            <p>Recebi de <strong>${nomePagador}</strong>${cpfPagador ? `, CPF/CNPJ: ${cpfPagador}` : ''}${enderecoPagador ? `, residente em ${enderecoPagador}` : ''}, a quantia de <strong>R$ ${valorFormatado}</strong> (${valorExtenso})${referente ? `, referente a ${referente}` : ''}, pago através de <strong>${formaPagamento}</strong>.</p>
    `;

    html += `
        <p style="margin-top: 20px;"><strong>Dados do Recebedor:</strong></p>
        <p>Nome: ${nomeRecebedor}</p>
    `;

    if (cpfRecebedor) {
        html += `<p>CPF/CNPJ: ${cpfRecebedor}</p>`;
    }

    if (enderecoRecebedor) {
        html += `<p>Endereço: ${enderecoRecebedor}</p>`;
    }

    if (observacoes) {
        html += `
            <p style="margin-top: 20px;"><strong>Observações:</strong></p>
            <p>${observacoes}</p>
        `;
    }

    html += `
        </div>
        
        <div class="preview-footer">
            <p>${cidade ? cidade + ', ' : ''}${dataFormatada}</p>
            
            <div class="signature-line">
                ${nomeRecebedor}
            </div>
        </div>
    `;

    return html;
}
