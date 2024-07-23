// const jwt = require('jsonwebtoken')
// const config = require('config')

// module.exports = (req, res, next) => {
//     if (req.method === 'OPTIONS') {
//        return next()
//     }

//     try {
//         const token = req.headers.authorization.split(' ')[1]
//         if (!token) {
//             return res.status(401).json({message: 'ерай Auth error'})
//         }
//         const decoded = jwt.verify(token, config.get('secretKey'))
//         req.user = decoded
//         next()
//     } catch (e) {
//         return res.status(401).json({message: 'кеч Auth error'})
//     }
// }

const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    console.error('auth.middleware  ' + 1);
    if (req.method === 'OPTIONS') {
        console.error('auth.middleware  ' + 12);

        return next();
    }

    try {
        console.error('auth.middleware  ' + 2);
        const authHeader = req.headers.authorization;
        console.error('auth.middleware  ' + 3+':' + authHeader);

        if (!authHeader) {
            console.error('Authorization header is missing');
            return res.status(401).json({ message: 'Authorization header is missing' });
        }
        console.error('auth.middleware  ' + 4+':' + authHeader);

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.error('Token is missing from header');
            return res.status(401).json({ message: 'Token is missing' });
        }

        // Декодуємо токен
        const decoded = jwt.verify(token, config.get('secretKey'));
        req.user = decoded;
        next();
    } catch (e) {
        console.error('Error verifying token:', e.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};
