import { app } from "~/src";
import { PORT, SERVER_TIMEOUT } from "~/src/lib/constants";

export default {
  port: Number(PORT),
  fetch: app.fetch,
  idleTimeout: SERVER_TIMEOUT,
};
