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
                    dbo.Stock.PGROUP, 
                    dbo.Stock.GRPCODE, 
                    dbo.Stock.ITEMNO, 
                    dbo.Stock.DESC#1, 
                    dbo.Stock.DESC#2, 
                    dbo.Stock.DESC#3, 
                    dbo.Stock.Status, 
                    dbo.Stock.STKLEVEL AS STKLEVEL_OVERALL, 
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

    // const body = req.body;
    // const id = req.params.recid;
    // const updateBulk = (recid, status, quantity, type) => {
    //     return req.mssql.request()
    //         .input('status', sql.Int, parseInt(status))
    //         .input('recid', sql.NVarChar, recid)
    //         .input('qty', sql.Int, quantity)
    //         .query(`UPDATE dbo.Stock SET STATUS = @status, STKLEVEL = STKLEVEL ${type === 'add' ? '+' : '-'} @qty, QTYALLOC = 0 WHERE RECID = @recid`)
    //         .then(rtn)
    //         .catch(next)
    //         ;
    // };

    // const updateUnique = (recid, status, type) => {
    //     return req.mssql.request()
    //         .input('status', sql.Int, parseInt(status))
    //         .input('recid', sql.NVarChar, recid)
    //         .query(`UPDATE dbo.Stock SET STATUS = @status, QTYHIRE = ${type === 'add' ? 1 : 0}, QTYREP = ${(type === 'substract' && status === 2 ? 1 : 0)} WHERE RECID = @recid`)
    //         .then(rtn)
    //         .catch(next)
    //         ;
    // };

    // const rtn = result => {
    //     if (!result || !result.rowsAffected[0])
    //         throw new errors.http.NotFound(`Updaten van stock item met recid: ${req.params.recid} is mislukt.`);

    //     return res.status(200).send({ success: true, data: req.params });
    // };

    // if (body.unique) return updateUnique(id, body.status, body.type);
    // return updateBulk(id, body.status, body.quantity, body.type);
}
