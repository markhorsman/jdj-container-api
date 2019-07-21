const AbstractError = require('./AbstractError');

module.exports      = class InternalServerError extends AbstractError
{
    constructor(message, data)
    {
        super(message || 'Internal Server Error', data, 500);
    }
};
