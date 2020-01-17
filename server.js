const Koa = require('koa');
const Router = require('@koa/router');
const serve = require('koa-static');
const morgan = require('koa-morgan');

const koa = new Koa();
const router = new Router();

koa.use(morgan('dev'));
koa.use(router.routes());
koa.use(serve('./dist'));

koa.listen(1488);
