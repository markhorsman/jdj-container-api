const AbstractError = require('./AbstractError');

module.exports = class NotFound extends AbstractError
{
    constructor(message, data)
    {
        super(message || 'Not Found', data, 404);
    }
}
