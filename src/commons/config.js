export const secretKey = "DqLY3qB8nz2cvW1c9Lqq8gG56TYZ5cKaQXkqLnFc8MlcU9EsP1tWmQxAor7BvuKn";
export const jwtExpiration = 1800;           // 30 min

export const environments = {
  dev: {
    httpPORT: 12345,
    envName: "development",
    serverName: "localhost",
    sslKey: "ssl/api-pattern.key",
    sslCrt: "ssl/api-pattern.crt",
    dbURL: "mongodb://localhost:27017/bddexample",
    frontURL: "http://localhost:3333",
    originCORS: [/.*$/],
  },
  test: {
    httpPORT: 12346,
    envName: "testing",
    serverName: "localhost",
  },
  production: {
    httpPORT: 3000,
    envName: "production",
    serverName: "localhost",
    // REMOVED sslKey & Crt to fallback in HTTP because of the reverse proxy
    sslKey: "",
    sslCrt: "",
    dbURL: "mongodb://localhost:27017/bddexample",
    frontURL: "http://localhost:3333",
    originCORS: [/.*$/],
  },
};
