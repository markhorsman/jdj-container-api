const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

const moment = require("moment");
const generateRecId = () => moment().format('YYYYMMDDHHmmss') + Math.floor(100000 + Math.random() * 900000);

module.exports = {
    get: function (req, res, next) {
        const fields = ['RECID', 'ACCT', 'CODE', 'NAME', 'ADDRESS1', 'ADDRESS2', 'ADDRESS3', 'ADDRESS4', 'POSTCODE', 'TELEPHONE', 'EMAIL', 'REFERENCE', 'IDENTIFICATION'];
        let limit = 1;

        const findOne = id => {
            return req.mssql.request()
                .input('identification', sql.NVarChar, id)
                .query(`SELECT TOP ${limit} ${fields.join(',')} FROM dbo.CustomerContact WHERE REFERENCE = @identification`)
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
    },

    create: function (req, res, next) {
        return req.mssql.request()
            .input('recid', sql.NVarChar, generateRecId())
            .input('acct', sql.NVarChar, req.body.ACCT)
            .input('code', sql.NVarChar, req.body.CODE)
            .input('name', sql.NVarChar, req.body.NAME)
            .input('address1', sql.NVarChar, req.body.ADDRESS1)
            .input('telephone', sql.NVarChar, req.body.TELEPHONE)
            .input('email', sql.NVarChar, req.body.EMAIL)
            .input('reference', sql.NVarChar, req.body.REFERENCE)
            .input('onstop', sql.Int, 0)
            .input('encrypted', sql.Int, 1)
            .query(`INSERT INTO dbo.CustomerContact 
            ([RECID], [ACCT], [CODE], [NAME], [ADDRESS1], [TELEPHONE], [EMAIL], [REFERENCE], [ONSTOP], [ENCRYPTED]) 
            VALUES(@recid, @acct, @code, @name, @address1, @telephone, @email, @reference, @onstop, @encrypted)`)
            .then(result => res.status(200).send({ success: true, rowsAffected: result.rowsAffected[0] }))
            .catch(next)
            ;
    }

}
