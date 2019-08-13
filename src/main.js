const path = require('path');
const P = require('bluebird');
const express = require("express");
const basicAuth = require('express-basic-auth');
const bodyParser = require("body-parser");
const cors = require('cors');
const nconf = require('nconf');
const sql = P.promisifyAll(require("mssql"));
const reduce = require('lodash/reduce');
const find = require('lodash/find');

const handlers = require('./handlers');
const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../config.json') });

const getMssqlPool = db => {
  return new sql.ConnectionPool({
    user: cnf.get('sql:user'),
    password: cnf.get('sql:password'),
    server: cnf.get('sql:server'),
    database: db
  }).connect().then((conn) => {
    console.log('connected to database: %s', db);
    return conn;
  })
    .catch(e => {
      console.log(e);
      return null;
    });
};

const getInstances = () => {
  return P.map(cnf.get('sql:databases'), db => getMssqlPool(db.name).then(conn => ({ db, conn })))
    .then(results => {
      const db = find(results, { db: { default: true } }, null);

      if (!db) throw new Error('No default mssql connection defined');

      return P.props({
        app: express(),
        dbpools: reduce(results, (acc, o) => { acc[o.db.name] = o.conn; return acc }, {}),
        mssql: db.conn,
      });
    })
    ;
};

const setup = insts => {
  insts.app.use(cors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }));

  insts.app.use(basicAuth({ users: cnf.get('auth') }));
  insts.app.use(bodyParser.json({ limit: '50mb' }));
  insts.app.use(bodyParser.urlencoded({ extended: true }));

  insts.app.use((req, res, next) => {
    req.mssql = insts.mssql;
    req.dbpools = insts.dbpools;
    next();
  });

  insts.app.get("/customercontact/:identification?", handlers.customerContact.get);
  insts.app.post("/customercontact", handlers.customerContact.create);
  insts.app.put("/contitem/:recid/:status", handlers.contItem);
  insts.app.put("/stock/:recid", handlers.stock);
  insts.app.put("/stocktransfer", handlers.stockTransfer);
  insts.app.post("/offhire", handlers.offhire);
  insts.app.use(handlers.error);

  return insts;
};

const run = insts => {
  insts.app.listen(cnf.get('bind:port') || 4000, () => {
    console.log("Listening on port %s...", cnf.get('bind:port'));
  });
};

getInstances(cnf).then(setup).then(run).catch(console.log);


