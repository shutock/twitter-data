import { app } from "~/src";

export default {
  port: Number(process.env.PORT || 1337),
  fetch: app.fetch,
};
