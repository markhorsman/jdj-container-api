module.exports  = {
    error : require('./error'),
    customerContact : {
        get: require('./customerContact').get,
        create: require('./customerContact').create
    },
    contItem: require('./contItem'),
    stock: require('./stock'),
    stockTransfer: require('./stockTransfer')
};
