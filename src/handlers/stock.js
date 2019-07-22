const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

module.exports = function (req, res, next) {
    const update = (recid, status, quantity, type) => {
        return req.mssql.request()
            .input('status', sql.Int, parseInt(status))
            .input('recid', sql.NVarChar, recid)
            .input('qty', sql.Int, quantity)
            .query(`UPDATE dbo.Stock SET STATUS = @status, STKLEVEL = STKLEVEL ${type === 'add' ? '+' : '-'} @qty WHERE RECID = @recid`)
            .then(rtn)
            .catch(next)
            ;
    };

    const rtn = result => {
        if (!result || !result.rowsAffected[0])
            throw new errors.http.NotFound(`Updaten van stock item met recid: ${req.params.recid} is mislukt.`);

        return res.status(200).send({ success: true, data: req.params });
    };

    return update(req.params.recid, req.params.status, req.params.quantity, req.params.type);
}
