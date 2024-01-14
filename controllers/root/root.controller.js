import { generateResponse } from '../../utils/helper.js';

const defaultHandler = (req, res, next) => {
    generateResponse(null, `Welcome to the ${process.env.APP_NAME} - API`, res);
};

export { defaultHandler }