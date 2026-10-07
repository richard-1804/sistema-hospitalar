// Valida o body e SOBRESCREVE req.body com os dados validados (campos desconhecidos são removidos).
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next(); // Libera para o controller!
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ mensagem: "Erro de validação", erro: error.issues });
    }
    return res.status(500).json({ message: "Erro na validação" });
  }
};

// Valida os parâmetros da URL (req.params). Os controllers convertem com Number().
export const validateParams = (schema) => (req, res, next) => {
  try {
    schema.parse(req.params);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ mensagem: "Parâmetro inválido", erro: error.issues });
    }
    return res.status(500).json({ message: "Erro na validação" });
  }
};
