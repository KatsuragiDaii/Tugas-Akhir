const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.sendStatus(403);

    // Terima token polos (seperti yang dikirim frontend) maupun format "Bearer <token>"
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;

    // Dulu token dan isi decoded dicetak ke console; token adalah rahasia, jadi tidak lagi dicetak.
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, message: err.message });
        }
        req.userId = decoded.id;
        next();
    });
}
