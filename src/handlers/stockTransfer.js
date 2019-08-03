const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

const moment = require("moment");
const generateRecId = () => moment().format('YYYYMMDDHHmmss') + Math.floor(100000 + Math.random() * 900000);

const createStockDepot = req => req.mssql.request()
    .input('recid', sql.NVarChar, generateRecId())
    .input('code', sql.NVarChar, req.body.CODE)
    .input('itemno', sql.NVarChar, req.body.ITEMNO)
    .input('stklevel', sql.Int, req.body.QTY)
    .input('qtyalloc', sql.Int, 0)
    .input('onorder', sql.Int, 0)
    .input('onhire', sql.Int, 0)
    .input('qtyrep', sql.Int, 0)
    .input('qtyser', sql.Int, 0)
    .input('fwdorder', sql.Int, 0)
    .input('cost', sql.Int, 0)
    .input('xhireqty', sql.Int, 0)
    .input('sid', sql.NVarChar, moment().format('YYYY-MM-DD HH:mm:ss'))
    .input('qtyit', sql.Int, 0)
    .input('minstk', sql.Int, 0)
    .input('maxstk', sql.Int, 0)
    .input('reorder', sql.Int, 0)
    .query(`INSERT INTO dbo.StkDepots 
            ([RECID], [CODE], [ITEMNO], [STKLEVEL], [QTYALLOC], [ONORDER], [ONHIRE], [QTYREP], [QTYSER], [FWDORDER], [COST], [XHIREQTY], [SID], [QTYIT], [MINSTK], [MAXSTK], [REORDER]) 
            VALUES(@recid, @code, @itemno, @stklevel, @qtyalloc, @onorder, @onhire, @qtyrep, @qtyser, @fwdorder, @cost, @xhireqty, @sid, @qtyit, @minstk, @maxstk, @reorder)`)
    .then((result => {
        if (!result.rowsAffected[0]) {
            throw new Error('Failed creating StkDepots row');
        }

        return updateStock(req, result);
    }))
    ;

const updateStockDepot = req => req.mssql.request()
    .input('stklevel', sql.Int, parseInt(req.body.QTY))
    .input('recid', sql.NVarChar, req.body.STOCK_DEPOT_RECID)
    .query(`UPDATE dbo.StkDepots SET STKLEVEL = STKLEVEL + @stklevel WHERE RECID = @recid`)
    .then((result => {
        if (!result.rowsAffected[0]) {
            throw new Error('Failed updating StkDepots row');
        }

        return updateStock(req, result);
    }))
    ;

const updateStock = (req, result) => {
    if (!result.rowsAffected[0]) return P.reject();

    return req.mssql.request()
        .input('itemno', sql.NVarChar, req.body.ITEMNO)
        .input('currdepot', sql.NVarChar, req.body.CODE)
        .query(`UPDATE dbo.Stock SET CURRDEPOT = @currdepot WHERE ITEMNO = @itemno`)
};

module.exports = function (req, res, next) {
    if (!req.body.STOCK_DEPOT_RECID) {
        return createStockDepot(req)
            .then(result => {
                if (!result.rowsAffected[0]) {
                    throw new Error('Failed updating Stock row');
                }

                res.status(200).send({ success: true });
            })
            .catch(next)
            ;
    } else {
        return updateStockDepot(req)
            .then(result => {
                if (!result.rowsAffected[0]) {
                    throw new Error('Failed updating Stock row');
                }

                res.status(200).send({ success: true });
            })
            .catch(next)
            ;
    }
}

