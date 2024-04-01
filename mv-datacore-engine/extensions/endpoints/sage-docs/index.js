const swaggerUi = require('swagger-ui-express');
const apiDoc = require('./openApiDocs');

module.exports = function registerEndpoint(router, { services, exceptions, env }) {
	router.use('/', swaggerUi.serve, swaggerUi.setup(apiDoc.default(), { swaggerOptions: { filter: true, persistAuthorization: true } }));
};