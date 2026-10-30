// 调用火山引擎方舟视觉模型，自动生成图片描述
// 未配置 ARK_API_KEY 时返回空字符串，不影响上传流程

const ARK_BASE = "https://ark.cn-beijing.volces.com/api/v3";

export async function describeImage(
  imageBuffer: Buffer,
  category: "home" | "outfit"
): Promise<{ description: string; colors: string }> {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    return { description: "", colors: "" };
  }

  const model = process.env.ARK_MODEL || "doubao-vision-pro-32k";
  const categoryLabel = category === "home" ? "家居空间" : "穿搭造型";
  const base64 = imageBuffer.toString("base64");

  try {
    const res = await fetch(`${ARK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // 8 秒超时：AI 描述只是附加信息，超时快速降级，绝不拖垮上传主流程
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64}` },
              },
              {
                type: "text",
                text: `这是一张${categoryLabel}类的审美参考图。请用中文简洁描述：1) 画面核心内容与氛围；2) 主要配色（列出3-5个具体色名，如"奶白、焦糖棕、橄榄绿"）。
严格按以下 JSON 格式返回，不要多余文字：
{"description": "一句话描述画面内容与氛围", "colors": "色1、色2、色3"}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return { description: "", colors: "" };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    // 尝试解析 JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description ?? "",
          colors: parsed.colors ?? "",
        };
      }
    } catch {}
    return { description: text.trim(), colors: "" };
  } catch {
    return { description: "", colors: "" };
  }
}

// AI 分析图片，返回标签数组
export async function analyzeTags(imageBuffer: Buffer): Promise<string[]> {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) return [];

  const model = process.env.ARK_MODEL || "doubao-vision-pro-32k";
  const base64 = imageBuffer.toString("base64");

  try {
    const res = await fetch(`${ARK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
              {
                type: "text",
                text: `这是一张家居/穿搭类审美参考图。请生成5-8个中文标签，描述图中的：物件、颜色、风格、场景、材质等。
严格按 JSON 数组返回，不要多余文字：["标签1","标签2","标签3"]`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    return [];
  } catch {
    return [];
  }
}
