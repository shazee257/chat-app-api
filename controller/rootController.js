const { generateResponse } = require('../utils');

const defaultHandler = (req, res, next) => {
    generateResponse(null, `Welcome to the ${process.env.APP_NAME} - API`, res);
};

module.exports = {
    defaultHandler
}
