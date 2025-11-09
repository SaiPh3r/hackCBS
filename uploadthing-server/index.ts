// index.ts
import express from "express";
import cors from "cors";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./server";
import dotenv from "dotenv";

// global.d.ts



if (!globalThis.crypto) {
  globalThis.crypto = new Crypto();
}



dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use("/api/uploadthing", (req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.url);
  next();
});

// **Do NOT manually pass token**
app.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));

app.listen(3001, () => {
  console.log("✅ UploadThing server running at http://localhost:3001");
  Object.keys(uploadRouter).forEach((key) => {
    console.log(`- /api/uploadthing/${key}`);
  });
});