const AbstractError = require('./AbstractError');

module.exports = class NotAuthorized extends AbstractError
{
    constructor(message, data)
    {
        super(message || 'Not Authorized', data, 401);
    }
}
