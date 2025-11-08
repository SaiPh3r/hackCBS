// server (core.ts)
import { createUploadthing, type FileRouter } from "uploadthing/express";
import dotenv from "dotenv";
dotenv.config();
const f = createUploadthing();

export const uploadRouter = {
  pdfUploader: f({
    pdf: {
      maxFileSize: "64MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(({ file, metadata }) => {
    console.log("✅ PDF upload completed:", file.name, "->", file.ufsUrl);
    console.log("📄 Metadata:", metadata);
    return { url: file.ufsUrl }; // make sure it's ufsUrl, not url
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;