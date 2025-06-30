// functions/api/authProxy.js

export async function onRequest(context) {
  try {
    const { request, env } = context;

    // Extrai o caminho da URL da requisição original.
    const url = new URL(request.url);
    const apiPath = url.pathname.replace(/^\/api\/authProxy/, ''); // Remove a base do caminho do proxy

    // Monta a URL final para a API de destino.
    const targetUrl = `https://api.samuellopes.com.br${apiPath}${url.search}`;

    // Prepara os cabeçalhos para a API externa,
    // copiando os cabeçalhos da requisição original e adicionando o token.
    const apiHeaders = new Headers(request.headers);
    apiHeaders.set('Authorization', `Bearer ${env.TOKEN}`);
    // O 'host' deve ser o da API de destino, não o do worker.
    apiHeaders.delete('host');


    // Faz a chamada para a API real, repassando o método, cabeçalhos e corpo.
    const apiResponse = await fetch(targetUrl, {
      method: request.method,
      headers: apiHeaders,
      body: request.body,
      redirect: 'follow' // Segue redirecionamentos
    });

    // Retorna a resposta da API externa diretamente para o cliente.
    return apiResponse;

  } catch (error) {
    // Em caso de erro na nossa função, retorna um erro 500.
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ message: 'Erro interno no proxy da função.', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
