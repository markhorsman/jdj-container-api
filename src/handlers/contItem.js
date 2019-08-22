const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

module.exports = function (req, res, next) {
    const update = (recid, memo) => {
        return req.mssql.request()
            .input('memo', sql.NVarChar, memo)
            .input('recid', sql.NVarChar, recid)
            .query('UPDATE dbo.ContItems SET MEMO = @memo WHERE RECID = @recid')
            .then(rtn)
            .catch(next)
            ;
    };

    const rtn = result => {
        if (!result || !result.rowsAffected[0])
            throw new errors.http.NotFound(`Updaten van contract item met recid: ${req.params.recid} is mislukt.`);

        return res.status(200).send({ success: true });
    };

    return update(req.params.RECID, req.body.MEMO);
}
