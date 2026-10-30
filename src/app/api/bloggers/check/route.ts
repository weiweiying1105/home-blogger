import { NextResponse } from "next/server";

/**
 * 校验 Ins 账号是否存在。
 * GET /api/bloggers/check?username=xxx
 * 返回：
 *   { exists: true,  name, username }   账号存在，name 为显示名
 *   { exists: false }                   账号不存在
 *   { exists: null,  reason }           无法确认（登录墙/网络异常/格式非法）
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("username") || "").trim();
  const username = raw.replace(/^@/, "").trim();

  if (!username) {
    return NextResponse.json({ exists: null, reason: "请输入 Ins 账号" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
    return NextResponse.json({ exists: null, reason: "账号格式不合法（只能含字母数字._）" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    if (res.status === 404) {
      return NextResponse.json({ exists: false });
    }
    if (res.status !== 200) {
      return NextResponse.json({ exists: null, reason: `Instagram 返回状态 ${res.status}` });
    }

    const html = await res.text();
    // 取 og:title：形如 "显示名 (@username) • Instagram photos and videos"
    const og =
      html.match(/<meta property="og:title" content="([^"]+)"/i) ||
      html.match(/property="og:title"\s+content="([^"]+)"/i);

    if (!og) {
      if (/accounts\/login/.test(html) || /login_required/i.test(html)) {
        return NextResponse.json({ exists: null, reason: "Instagram 要求登录，无法确认，请手动核对" });
      }
      return NextResponse.json({ exists: null, reason: "页面未返回账号信息，无法确认" });
    }

    const title = og[1].replace(/\s*\(@[^)]*\)\s*$/i, "").trim();
    return NextResponse.json({ exists: true, name: title || username, username });
  } catch {
    return NextResponse.json({ exists: null, reason: "网络异常，请稍后重试" });
  } finally {
    clearTimeout(timer);
  }
}
