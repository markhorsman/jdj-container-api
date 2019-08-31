const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

module.exports = async function (req, res, next) {
    let result;

    try {
        result = await req.mssql.request()
            .input('depot', sql.NVarChar, req.params.depot)
            .query(`
                SELECT TOP 25000 
                    dbo.Stock.RECID,
                    dbo.Stock.PGROUP, 
                    dbo.Stock.GRPCODE, 
                    dbo.Stock.ITEMNO, 
                    dbo.Stock.DESC#1 AS DESC1, 
                    dbo.Stock.DESC#2 AS DESC2,
                    dbo.Stock.DESC#3 AS DESC3,
                    dbo.Stock.Status, 
                    dbo.Stock.STKLEVEL AS STKLEVEL_OVERALL,
                    dbo.Stock.CURRDEPOT,
                    dbo.Stock.[UNIQUE],
                    dbo.StkDepots.STKLEVEL
                FROM 
                    dbo.Stock
                LEFT JOIN
                    Stkdepots 
                ON  
                    StkDepots.ITEMNO = Stock.ITEMNO AND Stkdepots.CODE = @depot
                WHERE
                    Stock.CURRDEPOT = @depot
                ORDER BY 
                    Stock.ITEMNO ASC`);
    } catch (e) {
        console.log(e);
    }

    if (!result || !result.recordset.length)
        throw new errors.http.NotFound('Geen artikelen gevonden voor depot: ' + req.params.depot);

    return res.status(200).send(result.recordset);
}
