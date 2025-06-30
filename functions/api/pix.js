// functions/api/pix.js

export async function onRequestPost(context) {
  try {
    // O 'context' contém as variáveis de ambiente, a requisição, etc.
    const { request, env } = context;

    // Pega o corpo da requisição original enviada pelo pix.html
    const payload = await request.json();

    // Prepara os cabeçalhos para a API externa, adicionando o token de segurança
    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.TOKEN}` // Aqui usamos a variável de ambiente!
    };

    // Faz a chamada para a API real
    const apiResponse = await fetch('https://api.samuellopes.com.br/v1/codepix', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(payload)
    });

    // Se a resposta da API externa não for OK, repassa o erro
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return new Response(JSON.stringify(errorData), {
        status: apiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Pega a resposta da API e a envia de volta para o frontend (pix.html)
    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Em caso de erro na nossa função, retorna um erro 500
    return new Response(JSON.stringify({ message: 'Erro interno no proxy da função.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
