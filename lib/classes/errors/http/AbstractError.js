"use strict";

/**
 * an abstract, extendable base Error class
 *
 * @type {Error}
 */
class AbstractError extends Error
{
    constructor(/*message, */...args)
    {
        let     msg  = '',
            len  = args.length;
        const   errs = [];

        if (len) {
            if (typeof args[0] === 'string')
                msg = args[0];

            while (len-- >= 0) if (args[len] instanceof Error) {
                errs.push(args[len]);

                if (!msg.length && typeof args[len].message === 'string')
                    msg = args[len].message;
            }
        }

        if (!msg)
            msg = 'an error occurred (no message given)';

        super(msg);

        if (this.constructor === AbstractError)
            throw new TypeError('Abstract error class cannot be instantiated directly.');

        this.message = msg;
        this.name    = this.constructor.name;

        switch (errs.length) {
            case 0 :                                    break;
            case 1 : this.originalError = errs[0];      break;
            default: this.originalError = errs.pop();
                this.otherErrors   = errs;         break;
        }

        if (typeof Error.captureStackTrace === 'function')
            Error.captureStackTrace(this, this.constructor);
        else
            this.stack = (new Error('')).stack;
    }
};

module.exports      = AbstractError;
try { module.exports.name = 'AbstractError'; } catch (e) {}
