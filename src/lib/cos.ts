import COS from "cos-nodejs-sdk-v5";
import sharp from "sharp";

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || "",
  SecretKey: process.env.COS_SECRET_KEY || "",
});

const BUCKET = process.env.COS_BUCKET || "home-blogger-1303796882";
const REGION = process.env.COS_REGION || "ap-guangzhou";
const PUBLIC_URL = `https://${BUCKET}.cos.${REGION}.myqcloud.com`;

export async function uploadToCOS(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; thumbnail?: string; size: number }> {
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 生成缩略图
  let thumbnailKey = "";
  try {
    const thumbBuffer = await sharp(buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    thumbnailKey = key.replace(/\.[^.]+$/, "-thumb.jpg");
    // 原图与缩略图并行上传，减少串行耗时
    await Promise.all([
      cos.putObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: thumbnailKey,
        Body: thumbBuffer,
        ContentType: "image/jpeg",
      }),
      cos.putObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: buffer,
        ContentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
      }),
    ]);
  } catch {
    // 缩略图生成失败时，退回仅上传原图
    await cos.putObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Body: buffer,
      ContentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    });
  }

  return {
    url: `${PUBLIC_URL}/${key}`,
    thumbnail: thumbnailKey ? `${PUBLIC_URL}/${thumbnailKey}` : undefined,
    size: buffer.length,
  };
}
