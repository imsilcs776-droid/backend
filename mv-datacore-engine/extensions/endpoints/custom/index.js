module.exports = function registerEndpoint(router, { services, exceptions }) {
  const { ItemsService } = services;
  const { ServiceUnavailableException } = exceptions;

  router.get("/", (req, res) => {
    res.send("Welcome to custom endpoint.");
  });

  router.get("/collections", (req, res, next) => {
    const collectionService = new ItemsService("areas", {
      schema: req.schema,
      accountability: req.accountability,
    });

    collectionService
      .readByQuery({
        fields: ["*"],
      })
      .then((results) => {
        return res.json(results);
      })
      .catch((error) => {
        return next(new ServiceUnavailableException(error.message));
      });
  });
};
