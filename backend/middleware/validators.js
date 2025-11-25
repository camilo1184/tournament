const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Datos inválidos',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Validadores para autenticación
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('El usuario solo puede contener letras, números, guiones y guiones bajos'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('El usuario solo puede contener letras, números, guiones y guiones bajos'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('El rol debe ser admin o user'),
  handleValidationErrors
];

// Validadores para torneos
const validateTournament = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del torneo es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .escape(),
  body('type')
    .optional()
    .isIn(['league', 'knockout', 'groups', 'single-elimination', 'round-robin']).withMessage('Tipo de torneo inválido'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede tener más de 1000 caracteres')
    .escape(),
  body('registrationFee')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El valor de inscripción es demasiado largo'),
  body('prizes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción de premios es demasiado larga'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Fecha de inicio inválida'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Fecha de finalización inválida'),
  handleValidationErrors
];

// Validadores para equipos
const validateTeam = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del equipo es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .escape(),
  body('logo')
    .optional()
    .isString().withMessage('El logo debe ser una cadena de texto'),
  body('players')
    .optional()
    .isArray().withMessage('Los jugadores deben ser un array'),
  body('players.*.name')
    .if(body('players').exists())
    .trim()
    .notEmpty().withMessage('El nombre del jugador es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre del jugador debe tener entre 2 y 100 caracteres')
    .escape(),
  body('players.*.number')
    .if(body('players').exists())
    .optional()
    .isInt({ min: 0, max: 999 }).withMessage('El número debe estar entre 0 y 999'),
  body('players.*.position')
    .if(body('players').exists())
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La posición no puede tener más de 50 caracteres')
    .escape(),
  handleValidationErrors
];

// Validadores para partidos
const validateMatch = [
  body('tournamentId')
    .notEmpty().withMessage('El ID del torneo es requerido')
    .isMongoId().withMessage('ID de torneo inválido'),
  body('team1')
    .notEmpty().withMessage('El equipo 1 es requerido')
    .isMongoId().withMessage('ID de equipo 1 inválido'),
  body('team2')
    .notEmpty().withMessage('El equipo 2 es requerido')
    .isMongoId().withMessage('ID de equipo 2 inválido'),
  body('round')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La ronda no puede tener más de 50 caracteres'),
  body('roundName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre de la ronda no puede tener más de 100 caracteres')
    .escape(),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'finished']).withMessage('Estado de partido inválido'),
  handleValidationErrors
];

// Validadores para actualizar partido
const validateMatchUpdate = [
  body('team1Score')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('El marcador debe estar entre 0 y 99'),
  body('team2Score')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('El marcador debe estar entre 0 y 99'),
  body('homeScore')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('El marcador debe estar entre 0 y 99'),
  body('awayScore')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('El marcador debe estar entre 0 y 99'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'finished']).withMessage('Estado de partido inválido'),
  body('team1Scorers')
    .optional()
    .isArray().withMessage('Los goleadores deben ser un array'),
  body('team2Scorers')
    .optional()
    .isArray().withMessage('Los goleadores deben ser un array'),
  handleValidationErrors
];

// Validadores para IDs de MongoDB
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('ID inválido'),
  handleValidationErrors
];

// Validador para queries de búsqueda
const validateSearchQuery = [
  query('userId')
    .optional()
    .isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRegister,
  validateTournament,
  validateTeam,
  validateMatch,
  validateMatchUpdate,
  validateMongoId,
  validateSearchQuery,
  handleValidationErrors
};
