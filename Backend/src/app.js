const express = require('express');
const requestLogger = require('./middlewares/logging.middleware.js');
const errorHandler = require('./middlewares/errorHandler.middleware.js');
const mainRouter = require('./routes/index.routes.js');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/', mainRouter);

app.use(errorHandler);

module.exports = app;