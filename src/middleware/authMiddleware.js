

// Função que extrai o token do header Authorization: Bearer <TOKEN_JWT>, valida com jsonwebtoken e bloqueia requisições sem credencial com o status 401 Unauthorized.


// importando a biblioteca Json Web token p/ validar a assinatura e a expiração do token
import jwt from 'jsonwebtoken';

// Função do middleware a ser exportada com a assinatura do Express 
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization; //extrai a prorpiedade authorization do headers

  if (!authHeader) { // condiconal p/ verificar a existência do cabeçalho
    return res.status(401).json({ message: "Token não fornecido" });
  }

  // ANÁLISE DO FORMATO
  const parts = authHeader.split(' '); 
  if (parts.length !== 2 || parts[0] !== 'Bearer') { 
    return res.status(401).json({ message: "Token Inválido" });
  }

  // TRATAMENTO E SANITIZAÇÃO

  // Pega a segunda parte [1] token puro e remove espaços (.trim)
  const token = parts[1].trim().replace(/^"|"$/g, '');  

  try {

    // Tenta decodificar o token usando a chave secreta (JWT_SECRET) definida no ambiente.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta');

    req.user = decoded; // injeta os dados decodificados dentro do objeto req

    next(); // libera para o próximo passo (Sinal Verde)
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
};
