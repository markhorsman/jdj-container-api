const AbstractError = require('./AbstractError');

module.exports = class RateLimitPreemptedError extends AbstractError
{
    constructor(message, data)
    {
        super(message || 'Rate Limit Preempted Error', data, 429);
    }
};
