const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

module.exports = function (req, res, next) {
    const fields = ['RECID', 'ACCT', 'CODE', 'NAME', 'ADDRESS1', 'ADDRESS2', 'ADDRESS3', 'ADDRESS4', 'POSTCODE', 'TELEPHONE', 'EMAIL', 'REFERENCE', 'IDENTIFICATION'];
    let limit = 1;
    
    const findOne = id => {
        return req.mssql.request()
            .input('identification', sql.NVarChar, id)
            .query(`SELECT TOP ${limit} ${fields.join(',')} FROM dbo.CustomerContact WHERE IDENTIFICATION = @identification`)
            .then(rtn)
            .catch(next)
            ;
    };

    const findAll = () => {
        limit = 500;
        return req.mssql.request()
            .query(`SELECT TOP ${limit} ${fields.join(',')} FROM dbo.CustomerContact`)
            .then(rtn)
            .catch(next)
            ;
    };

    const rtn = result => {
        if (!result || !result.recordset.length)
            throw new errors.http.NotFound('Geen resultaat voor contact met identication: ' + req.params.identification);

        return res.status(200).send({ success: true, data: result.recordset });
    };

    if (req.params.identification) return findOne(req.params.identification);
    return findAll();
}
