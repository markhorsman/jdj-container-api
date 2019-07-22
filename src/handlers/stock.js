const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

module.exports = function (req, res, next) {
    const body = req.body;
    const id = req.params.recid;
    const updateBulk = (recid, status, quantity, type) => {
        return req.mssql.request()
            .input('status', sql.Int, parseInt(status))
            .input('recid', sql.NVarChar, recid)
            .input('qty', sql.Int, quantity)
            .query(`UPDATE dbo.Stock SET STATUS = @status, STKLEVEL = STKLEVEL ${type === 'add' ? '+' : '-'} @qty, QTYALLOC = 0 WHERE RECID = @recid`)
            .then(rtn)
            .catch(next)
            ;
    };

    const updateUnique = (recid, status, type) => {
        return req.mssql.request()
            .input('status', sql.Int, parseInt(status))
            .input('recid', sql.NVarChar, recid)
            .query(`UPDATE dbo.Stock SET STATUS = @status, QTYHIRE = ${type === 'add' ? 1 : 0}, QTYREP = ${(type === 'substract' && status === 2 ? 1 : 0)} WHERE RECID = @recid`)
            .then(rtn)
            .catch(next)
            ;
    };

    const rtn = result => {
        if (!result || !result.rowsAffected[0])
            throw new errors.http.NotFound(`Updaten van stock item met recid: ${req.params.recid} is mislukt.`);

        return res.status(200).send({ success: true, data: req.params });
    };

    if (body.unique) return updateUnique(id, body.status, body.type);
    return updateBulk(id, body.status, body.quantity, body.type);
}
