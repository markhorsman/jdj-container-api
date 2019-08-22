const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

module.exports = function (req, res, next) {
    const update = (recorder, memo) => {
        return req.mssql.request()
            .input('memo', sql.NVarChar, memo)
            .input('recorder', sql.NVarChar, recorder)
            .query('UPDATE dbo.ContItems SET MEMO = @memo WHERE RECORDER = @recorder')
            .then(rtn)
            .catch(next)
            ;
    };

    const rtn = result => {
        if (!result || !result.rowsAffected[0])
            throw new errors.http.NotFound(`Updaten van contract item met recorder: ${req.params.RECORDER} is mislukt.`);

        return res.status(200).send({ success: true });
    };

    return update(req.params.RECORDER, req.body.MEMO);
}
