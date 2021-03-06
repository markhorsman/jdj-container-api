const P = require('bluebird');
const moment = require('moment');
const sql = P.promisifyAll(require("mssql"));
const errors = require('../../lib/classes/errors');

const generateRecId = () => moment().format('YYYYMMDDHHmmss') + Math.floor(100000 + Math.random() * 900000);

const getStkDepot = async (r, itemno, code) => {
    let result;

    try {
        result = await r
            .input('itemno', sql.NVarChar, itemno)
            .input('code', sql.NVarChar, code)
            .query(`SELECT TOP 1 RECORDER FROM dbo.StkDepots WHERE ITEMNO = @itemno AND CODE = @code`);
    } catch (e) {
        throw e;
    }

    return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
};

const getStock = async (r, itemno) => {
    let result;

    try {
        result = await r
            .input('itemno', sql.NVarChar, itemno)
            .query(`SELECT TOP 1 RECORDER FROM dbo.Stock WHERE ITEMNO = @itemno`);
    } catch (e) {
        throw e;
    }

    return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
};

const getStockQTYHire = async (r, recorder) => {
    let result;

    try {
        result = await r
            .input('recorder', sql.NVarChar, recorder)
            .query(`SELECT TOP 1 QTYHIRE FROM dbo.Stock WHERE RECORDER = @recorder`);
    } catch (e) {
        throw e;
    }

    return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
};

// const getContItem = async (r, contno, itemno, memo) => {
//     let result;

//     try {
//         result = await r
//             .input('contno', sql.NVarChar, contno)
//             .input('itemno', sql.NVarChar, itemno)
//             .input('memo', sql.NVarChar, memo)
//             .input('status', sql.Int, 1)
//             .query(`SELECT TOP 1 RECORDER, LINETOT FROM dbo.ContItems WHERE CONTNO = @contno AND ITEMNO = @itemno AND MEMO LIKE %@memo% AND STATUS = @status ORDER BY ROWORDER DESC`);
//     } catch (e) {
//         throw e;
//     }

//     return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
// };

// const getContract = async (r, contno) => {
//     let result;

//     try {
//         result = await r
//             .input('contno', sql.NVarChar, contno)
//             .query(`SELECT TOP 1 RECORDER, ACCT FROM dbo.Contract WHERE CONTNO = @contno`);
//     } catch (e) {
//         throw e;
//     }

//     return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
// };

// const getVatCode = async (r, acct) => {
//     let result;

//     try {
//         result = await r
//             .input('acct', sql.NVarChar, acct)
//             .query(`SELECT TOP 1 VATCODE FROM dbo.Lookup WHERE ACCT = @acct`);
//     } catch (e) {
//         throw e;
//     }

//     return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
// };

// const getVatRate = async (r, vatcode) => {
//     let result;

//     try {
//         result = await r
//             .input('vatcode', sql.NVarChar, vatcode)
//             .query(`SELECT TOP 1 VATRATE FROM dbo.VatRates WHERE VATCODE = @vatcode`);
//     } catch (e) {
//         throw e;
//     }

//     return (result && result.recordset && result.recordset.length ? result.recordset[0] : false);
// };

const updateContAddr = async (r, contno) => {
    let result;
    try {
        result = await r
            .input('sid', sql.NVarChar, moment().format('YYYY-MM-DD HH:mm:ss'))
            .input('contno', sql.NVarChar, contno)
            .query(`UPDATE dbo.ContAddr SET SID = @sid WHERE CONTNO = @contno`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateStkDepot = async (r, recorder, qtyok, qtydam, qtylost) => {
    // STKLEVEL = STKLEVEL - QTYLOST
    // QTYREP = QTYREP + QTYDAM
    // ONHIRE = ONHIRE - QTYOK

    let result;
    try {
        result = await r
            .input('qtyok', sql.Int, parseInt(qtyok))
            .input('qtydam', sql.Int, parseInt(qtydam))
            .input('qtylost', sql.Int, parseInt(qtylost))
            .input('sid', sql.NVarChar, moment().format('YYYY-MM-DD HH:mm:ss'))
            .input('recorder', sql.NVarChar, recorder)
            .query(`UPDATE dbo.StkDepots SET STKLEVEL = STKLEVEL + @qtyok, QTYREP = QTYREP + @qtydam, ONHIRE = ONHIRE - @qtyok, SID = @sid WHERE RECORDER = @recorder`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateStock = async (r, recorder, qty) => {
    let result;
    try {
        result = await r
            .input('qty', sql.Int, parseInt(qty))
            .input('recorder', sql.NVarChar, recorder)
            .query(`UPDATE dbo.Stock SET QTYHIRE = QTYHIRE - @qty, STKLEVEL = STKLEVEL + @qty WHERE RECORDER = @recorder`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateStockStatus = async (r, recorder, qtyhire, unique, qtyok, qtydam, qtylost) => {
    // if stock item = UNIQUE : QTYOK? SET STATUS = 0, QTYDAM? SET STATUS = 2, QTYLOST? SET STATUS = 9
    // if stock item != UNIQUE AND QTYHIRE = 0, SET STATUS = 0
    let status = 1;

    if (parseInt(unique)) {
        if (parseInt(qtyok)) status = 0;
        else if (parseInt(qtydam)) status = 2;
        else if (parseInt(qtylost)) status = 9;
    } else {
        if (!parseInt(qtyhire)) status = 0;
    }

    let result;
    try {
        result = await r
            .input('status', sql.Int, status)
            .input('recorder', sql.NVarChar, recorder)
            .query(`UPDATE dbo.Stock SET STATUS = @status WHERE RECORDER = @recorder`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateContItem = async (r, recorder, qty, hired, qtyretd) => {
    let result;
    try {
        result = await r
            .input('qty', sql.Decimal(15, 2), parseInt(qty))
            .input('recorder', sql.NVarChar, recorder)
            .input('dt', sql.NVarChar, moment().format('YYYY-MM-DD HH:mm:ss'))
            .input('status', sql.Int, ((qty + qtyretd) >= hired ? 2 : 1))
            .query(`UPDATE dbo.ContItems SET STATUS = @status, QTYRETD = QTYRETD + @qty, LASTINV = @dt, DOCDATE#5 = @dt, SID = @dt WHERE RECORDER = @recorder`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const updateOffhireInfoMobile = async (r, cirecid) => {
    let result;
    try {
        result = await r
            .input('cirecid', sql.NVarChar, cirecid)
            .query(`UPDATE dbo.OHInfoMobile SET COMPLETED = 1 WHERE CIRECID = @cirecid`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

const insertContNote = async (r, username, contno) => {
    let result;

    try {
        result = await r
            .input('recid', sql.NVarChar, generateRecId())
            .input('subject', sql.NVarChar, 'Uithuur')
            .input('body', sql.NVarChar, 'Uithuur WebPortal Applicatie')
            .input('type', sql.Int, 1)
            .input('username', sql.NVarChar, username)
            .input('isusernote', sql.Int, 0)
            .input('date', sql.NVarChar, moment().format('YYYY-MM-DD HH:mm:ss'))
            .input('contno', sql.NVarChar, contno)
            .query(`INSERT INTO dbo.ContNote 
            ([RECID], [PARID], [SUBJECT], [BODY], [TYPE], [USERNAME], [ISUSERNOTE], [DATE], [CONTNO], [JOBNO], [ORDNO], [ITEMNO], [INVNO], [DOCNO]) 
            VALUES(@recid, '', @subject, @body, @type, @username, @isusernote, @date, @contno, '', '', '', '', '')`);
    } catch (e) {
        throw e;
    }

    return (result && result.rowsAffected ? result.rowsAffected[0] : false);
};

// const updateContract = async (r, recorder, linetot, vatrate) => {
//     let result;
//     try {
//         result = await r
//             .input('linetot', sql.Decimal(15, 2), linetot)
//             .input('recorder', sql.NVarChar, recorder)
//             .input('dt', sql.NVarChar, moment().format('YYYY-MM-DD HH:mm:ss'))
//             .input('vat', sql.Int, (parseInt(vatrate) === 0 ? 1 : parseInt(vatrate) / 100))
//             .query(`UPDATE 
//                         dbo.Contracts 
//                     SET 
//                         GOODS = GOODS + @linetot, 
//                         VAT = VAT + (@linetot * @vat), 
//                         TOTAL = TOTAL + (@linetot + (@linetot * @vat)), 
//                         LASTCALC = @dt, 
//                         SID = @dt 
//                     WHERE 
//                         RECORDER = @recorder`);
//     } catch (e) {
//         throw e;
//     }

//     return (result && result.rowsAffected ? result.rowsAffected[0] : false);
// };

module.exports = function (req, res, next) {
    if (!req.body ||
        !req.body.CONTNO ||
        !req.body.ITEMNO ||
        !req.body.USERNAME ||
        !req.body.QTY ||
        !req.body.DEPOT ||
        typeof req.body.QTYOK === 'undefined' ||
        typeof req.body.QTYDAM === 'undefined' ||
        typeof req.body.QTYLOST === 'undefined' ||
        typeof req.body.UNIQUE === 'undefined' ||
        typeof req.body.CONTITEM_HIRED === 'undefined' ||
        typeof req.body.CONTITEM_QTYRETD === 'undefined' ||
        !req.body.MEMO ||
        !req.body.CONTITEM_RECORDER ||
        !req.body.CONTITEM_RECID
    ) {
        throw new errors.http.BadRequest(`Could not offhire item: ${req.body.ITEMNO} (missing params)`);
    }

    const t = new sql.Transaction(req.mssql);

    t.begin(async err => {
        let stkDepotRecorder,
            stockRecorder,
            stockQTYHire,
            // contractRecorder,
            // contractACCT,
            // lineTotal,
            // vatCode,
            // vatRate,
            result;
        let rolledBack = false;

        const failedMsg = `Could not offhire item: ${req.body.ITEMNO} (rolledback: ${rolledBack ? 'yes' : 'no'})`;

        t.on('rollback', aborted => {
            rolledBack = true
        });

        const r = new sql.Request(t);

        try {
            result = await updateContAddr(r, req.body.CONTNO);
            if (!result) throw new Error('Update ContAddr: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        try {
            result = await getStkDepot(r, req.body.ITEMNO, req.body.DEPOT);
            if (!result || !result.RECORDER) throw new Error('Get StkDepot: no results');
            stkDepotRecorder = result.RECORDER;
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        try {
            result = await updateStkDepot(r, stkDepotRecorder, req.body.QTYOK, req.body.QTYDAM, req.body.QTYLOST);
            if (!result) throw new Error('Update StkDepot: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        try {
            result = await getStock(r, req.body.ITEMNO);
            if (!result || !result.RECORDER) throw new Error('Get Stock: no results');
            stockRecorder = result.RECORDER;
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        try {
            result = await updateStock(r, stockRecorder, req.body.QTY);
            if (!result) throw new Error('Update Stock: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        if (!parseInt(req.body.UNIQUE)) {
            try {
                result = await getStockQTYHire(r, stockRecorder);
                if (!result || typeof result.QTYHIRE === 'undefined') throw new Error('Get StockQTYHire: no results');
                stockQTYHire = result.QTYHIRE;
            } catch (e) {
                console.log(e);
                t.rollback(err => {
                    if (err) console.log(err);
                    throw new errors.http.BadRequest(failedMsg);
                })
            }
        } else {
            stockQTYHire = null;
        }

        try {
            result = await updateStockStatus(
                r,
                stockRecorder,
                stockQTYHire,
                req.body.UNIQUE,
                req.body.QTYOK,
                req.body.QTYDAM,
                req.body.QTYLOST
            );
            if (!result) throw new Error('Update Stock Status: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        // try {
        //     result = await getContItem(r, req.body.CONTNO, req.body.ITEMNO, req.body.MEMO);
        //     if (!result || !result.RECORDER || typeof result.LINETOT === 'undefined') throw new Error('Get ContItem: no results');
        //     contItemRecorder = result.RECORDER;
        //     lineTotal = result.LINETOT;
        // } catch (e) {
        //     console.log(e);
        //     t.rollback(err => {
        //         if (err) console.log(err);
        //         throw new errors.http.BadRequest(failedMsg);
        //     })
        // }

        try {
            result = await updateContItem(r, req.body.CONTITEM_RECORDER, req.body.QTY, req.body.CONTITEM_HIRED, req.body.CONTITEM_QTYRETD);
            if (!result) throw new Error('Update ContItem: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        try {
            result = await updateOffhireInfoMobile(r, req.body.CONTITEM_RECID);
            if (!result) throw new Error('Update OHInfoMobile: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        try {
            result = await insertContNote(r, req.body.USERNAME, req.body.CONTNO);
            if (!result) throw new Error('Insert ContNote: no rows affected');
        } catch (e) {
            console.log(e);
            t.rollback(err => {
                if (err) console.log(err);
                throw new errors.http.BadRequest(failedMsg);
            })
        }

        // try {
        //     result = await getContract(r, req.body.CONTNO);
        //     if (!result || !result.RECORDER || !result.ACCT) throw new Error('Get Contract: no results');
        //     contractRecorder = result.RECORDER;
        //     contractACCT = result.ACCT;
        // } catch (e) {
        //     console.log(e);
        //     t.rollback(err => {
        //         if (err) console.log(err);
        //         throw new errors.http.BadRequest(failedMsg);
        //     })
        // }

        // try {
        //     result = await getVatCode(r, contractACCT);
        //     if (!result || typeof result.VATCODE === 'undefined') throw new Error('Get VatCode: no results');
        //     vatCode = result.VATCODE;
        // } catch (e) {
        //     console.log(e);
        //     t.rollback(err => {
        //         if (err) console.log(err);
        //         throw new errors.http.BadRequest(failedMsg);
        //     })
        // }

        // try {
        //     result = await getVatRate(r, vatCode);
        //     if (!result || typeof result.VATRATE === 'undefined') throw new Error('Get VatRate: no results');
        //     vatRate = result.VATRATE;
        // } catch (e) {
        //     console.log(e);
        //     t.rollback(err => {
        //         if (err) console.log(err);
        //         throw new errors.http.BadRequest(failedMsg);
        //     })
        // }

        // try {
        //     result = await updateContract(r, contractRecorder, lineTotal, vatRate);
        //     if (!result) throw new Error('Update Contract: no rows affected');
        // } catch (e) {
        //     console.log(e);
        //     t.rollback(err => {
        //         if (err) console.log(err);
        //         throw new errors.http.BadRequest(failedMsg);
        //     })
        // }


        t.commit(err => {
            if (err) {
                throw new errors.http.BadRequest(failedMsg);
            }

            return res.status(200).send({ success: true });
        });
    })
}