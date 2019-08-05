const P = require('bluebird');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

const moment = require("moment");
const generateRecId = () => moment().format('YYYYMMDDHHmmss') + Math.floor(100000 + Math.random() * 900000);

const createStockDepot = async req => {
    let result;

    try {
        result = await req.mssql.request()
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
            VALUES(@recid, @code, @itemno, @stklevel, @qtyalloc, @onorder, @onhire, @qtyrep, @qtyser, @fwdorder, @cost, @xhireqty, @sid, @qtyit, @minstk, @maxstk, @reorder)`);
    } catch (e) {
        result = false;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateStockDepot = async (req, recid, qty, operator) => {
    let result;

    try {
        result = await req.mssql.request()
            .input('stklevel', sql.Int, parseInt(qty))
            .input('recid', sql.NVarChar, recid)
            .query(`UPDATE dbo.StkDepots SET STKLEVEL = STKLEVEL ${operator} @stklevel WHERE RECID = @recid`);
    } catch (e) {
        result = false;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateStock = async req => {
    let result;

    try {
        result = await req.mssql.request()
            .input('recid', sql.NVarChar, req.body.RECID)
            .input('currdepot', sql.NVarChar, req.body.CODE)
            .query(`UPDATE dbo.Stock SET CURRDEPOT = @currdepot WHERE RECID = @recid`);
    } catch (e) {
        result = false;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

module.exports = async function (req, res, next) {
    // update source stock depot STKLEVEL
    if (req.body.STOCK_DEPOT_SOURCE) {
        const stkDepotUpdate = await updateStockDepot(req, req.body.STOCK_DEPOT_SOURCE, req.body.QTY, '-');
        if (!stkDepotUpdate) {
            throw new errors.http.BadRequest(`Could not update StkDepots record with RECID: ${req.body.STOCK_DEPOT_SOURCE}`);
        }
    }

    // update current stock depot STKLEVEL
    if (req.body.CURRENT_STOCK_DEPOT) {
        const curStkDepotUpdate = await updateStockDepot(req, req.body.CURRENT_STOCK_DEPOT, req.body.QTY, '+');
        if (!curStkDepotUpdate) {
            throw new errors.http.BadRequest(`Could not update StkDepots record with RECID: ${req.body.CURRENT_STOCK_DEPOT}`);
        }
    } else {
        // create new stock depot record
        const createStkDepot = await createStockDepot(req);
        if (!createStkDepot) {
            throw new errors.http.BadRequest(`Could not create new StkDepots record for stock item: ${req.body.ITEMNO} and depot: ${req.body.CODE}`);
        }
    }

    // update stock record
    const result = await updateStock(req);
    if (!result) {
        throw new errors.http.BadRequest(`Could not update stock item: ${req.body.ITEMNO}`);
    }

    res.status(200).send({ success: true });
}