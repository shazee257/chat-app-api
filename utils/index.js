const { sign } = require("jsonwebtoken");

// generate response with status code
const generateResponse = (data, message, res, code = 200) => {
    return res.status(code).json({
        message,
        data,
    });
}

// parse body to object or json (if body is string)
const parseBody = (body) => {
    let obj;
    if (typeof body === "object") obj = body;
    else obj = JSON.parse(body);
    return obj;
}

// pagination with mongoose paginate library
const getMongoosePaginatedData = async ({
    model, page = 1, limit = 10, query = {}, populate = '', select = '-password', sort = { createdAt: -1 },
}) => {
    const options = {
        select,
        sort,
        populate,
        lean: true,
        page,
        limit,
        customLabels: {
            totalDocs: 'totalItems',
            docs: 'data',
            limit: 'perPage',
            page: 'currentPage',
            meta: 'pagination',
        },
    };

    const { data, pagination } = await model.paginate(query, options);
    delete pagination?.pagingCounter;

    return { data, pagination };
}

// aggregate pagination with mongoose paginate library
const getMongooseAggregatePaginatedData = async ({
    model, page = 1, limit = 10, query = []
}) => {
    const options = {
        page,
        limit,
        customLabels: {
            totalDocs: 'totalItems',
            docs: 'data',
            limit: 'perPage',
            page: 'currentPage',
            meta: 'pagination',
        },
    };

    const myAggregate = model.aggregate(query);
    const { data, pagination } = await model.aggregatePaginate(myAggregate, options);

    delete pagination?.pagingCounter;

    return { data, pagination };
}

// generate access token
const generateAccessToken = (user) => {
    const { ACCESS_TOKEN_EXPIRATION, ACCESS_TOKEN_SECRET } = process.env;

    const token = sign({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });

    return token;
};

module.exports = {
    generateResponse,
    parseBody,
    getMongoosePaginatedData,
    getMongooseAggregatePaginatedData,
    generateAccessToken,
}