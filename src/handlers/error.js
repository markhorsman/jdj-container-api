const filter = require('lodash/filter');
const trim = require('lodash/trim');

// locals

/**
 * take a stacktrace string and returns a parsed data structure.
 *
 * @param  {String}         stack
 * @return {Array[Object]}
 */
const parseStackTrace       = stack => {
    const line_re = /^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;

    return filter(trim(stack).split('\n').map(line => {
        const parts = line_re.exec(line);

        if (!parts)
            return;

        return {
            file     : parts[2],
            function : parts[1] || '<unknown>',
            line     : +parts[3],
            column   : parts[4] ? +parts[4] : null
        };
    }));
}

const getStatusCode         = err => (err && err.statusCode || err.status) || 500;
const getTitle              = err => (err && err.title) || (err.constructor || err || {}).name;

const showHTMLOutput        = req => {
    const accept = req.accepts(['json', 'html']);

    // TODO: maybe check content-type of request?
    return accept !== 'json';
};

// exports ...
const handleError           = (err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.log(err);

    if (res.headersSent || showHTMLOutput(req))
        return next(err); // just let express close the connection (and whatever else it does it terms of housekeeping)

    const errors = [err];

    if (err.originalError)
        errors.push(err.originalError);

    if (Array.isArray(err.errors))
        if (err.errors.length)
            errors.push(...err.errors);

    const status = getStatusCode(err),
        isProd = req.app.get('env') !== 'development'
    ;

    res.status(status).json({
        success     : false,
        errors      : errors.map(error => ({
            status  : String(getStatusCode(error)),
            source  : error.source,
            title   : getTitle(error),
            detail  : error.message,
            stack   : isProd ? undefined : parseStackTrace(error.stack)
        }))
    });
};

module.exports = handleError;
