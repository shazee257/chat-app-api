import jwt from 'jsonwebtoken';

// generate response with status code
export const generateResponse = (data, message, res, code = 200) => {
    return res.status(code).json({
        message,
        data,
    });
}

// parse body to object or json (if body is string)
export const parseBody = (body) => {
    let obj;
    if (typeof body === "object") obj = body;
    else obj = JSON.parse(body);
    return obj;
}

// pagination with mongoose paginate library
export const getMongoosePaginatedData = async ({
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
export const getMongooseAggregatePaginatedData = async ({
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
export const generateAccessToken = (user) => {
    const { ACCESS_TOKEN_EXPIRATION, ACCESS_TOKEN_SECRET } = process.env;

    const token = jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });

    return token;
};

// remove unused multer image files when error occurs
export const removeUnusedMulterImageFilesOnError = (req) => {
    try {
        const multerFile = req.file;
        const multerFiles = req.files;

        if (multerFile) {
            // If there is file uploaded and there is validation error
            // We want to remove that file
            removeLocalFile(multerFile.path);
        }

        if (multerFiles) {
            /** @type {Express.Multer.File[][]}  */
            const filesValueArray = Object.values(multerFiles);
            // If there are multiple files uploaded for more than one fields
            // We want to remove those files as well
            filesValueArray.map((fileFields) => {
                fileFields.map((fileObject) => {
                    removeLocalFile(fileObject.path);
                });
            });
        }
    } catch (error) {
        // fail silently
        console.log("Error while removing image files: ", error);
    }
}
