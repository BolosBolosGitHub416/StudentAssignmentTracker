const logger = (req, res, next) => {
    console.log(`url: ${req.url}`);
    console.log(`query: ${JSON.stringify(req.query)}`);
    console.log(`params: ${JSON.stringify(req.params)}`);
    console.log(`body: ${JSON.stringify(req.body)}`);
    next();
};

module.exports = logger;
