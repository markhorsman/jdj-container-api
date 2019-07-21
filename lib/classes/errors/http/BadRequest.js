const AbstractError = require('./AbstractError');

module.exports = class BadRequest extends AbstractError
{
    constructor(message, data)
    {
        super(message || 'Bad Request', data, 400);
    }
}
