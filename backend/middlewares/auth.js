import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // “Bearer <token>”

  if (!authHeader) return res.status(403).json({ message: 'Token not provided' });

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(403).json({ message: 'Formato de token inválido' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = decoded; // { id, username }
    next();
  });
};
