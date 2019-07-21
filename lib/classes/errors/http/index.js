
"use strict";

module.exports  = {
    InternalServerError     : require('./InternalServerError'),
    RateLimitPreemptedError : require('./RateLimitPreemptedError'),
    NotAuthorized           : require('./NotAuthorized'),
    BadRequest              : require('./BadRequest'),
    NotFound                : require('./NotFound'),
};
