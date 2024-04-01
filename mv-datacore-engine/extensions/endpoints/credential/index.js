module.exports = function registerEndpoint(router, { services, exceptions }) {
  const { ItemsService } = services;
  const { ServiceUnavailableException } = exceptions;

  router.get("/", (req, res) => {
    res.send("Credential root path");
  });
};
