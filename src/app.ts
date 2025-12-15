import { Hono } from "hono";
import { getData } from "./get-data";

export const app = new Hono();

app.get("/:username", async (c) => {
  const username = c.req.param("username");
  const postsLimit = Number(
    c.req.query("postsLimit") || process.env.POSTS_LIMIT || 100
  );

  try {
    const data = await getData(username, { postsLimit });
    return c.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});
