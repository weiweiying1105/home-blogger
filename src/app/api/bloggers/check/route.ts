import { NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** 带超时的 fetch */
async function timedFetch(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 校验 Ins 账号是否存在，多级通道逐级 fallback：
 *  A. 直连个人主页页面，解析 og:title
 *  B. 官方 web_profile_info 端点（带 x-ig-app-id）
 *  C. r.jina.ai 渲染代理
 * 返回：{ exists: true, name, username } | { exists: false } | { exists: null, reason }
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

  // ---- 通道 A：直连主页页面 ----
  try {
    const res = await timedFetch(
      `https://www.instagram.com/${username}/`,
      {
        redirect: "follow",
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      },
      6000
    );
    if (res.status === 404) return NextResponse.json({ exists: false });
    if (res.status === 200) {
      const html = await res.text();
      const og =
        html.match(/<meta property="og:title" content="([^"]+)"/i) ||
        html.match(/property="og:title"\s+content="([^"]+)"/i);
      if (og) {
        const name = og[1].replace(/\s*\(@[^)]*\)\s*$/i, "").trim();
        return NextResponse.json({ exists: true, name: name || username, username });
      }
    }
  } catch {
    // 继续下一通道
  }

  // ---- 通道 B：官方 web_profile_info 端点 ----
  try {
    const res = await timedFetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent": UA,
          "x-ig-app-id": "936619743392459",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      6000
    );
    if (res.status === 404) return NextResponse.json({ exists: false });
    if (res.ok) {
      const j = await res.json();
      const user = j?.data?.user;
      if (user) {
        return NextResponse.json({
          exists: true,
          name: user.full_name || user.username || username,
          username,
        });
      }
      return NextResponse.json({ exists: false });
    }
  } catch {
    // 继续下一通道
  }

  // ---- 通道 C：r.jina.ai 渲染代理 ----
  try {
    const res = await timedFetch(
      `https://r.jina.ai/https://www.instagram.com/${username}/`,
      { headers: { "User-Agent": UA } },
      10000
    );
    if (res.ok) {
      const text = await res.text();
      const gone = /sorry, this page isn't available|page isn't available|this page isn't available/i.test(text);
      if (gone) return NextResponse.json({ exists: false });
      if (text.includes(`@${username}`) || /instagram/i.test(text)) {
        // 提取显示名：jina 文本第一行通常是 "@账号 显示名"
        const m = text.match(/@[A-Za-z0-9._]+\s+([^\n]{1,60})/);
        const name = m?.[1]?.trim() || username;
        return NextResponse.json({ exists: true, name, username });
      }
    }
  } catch {
    // 继续
  }

  return NextResponse.json({ exists: null, reason: "暂时无法确认（Instagram 网络受限），请手动打开账号核对" });
}
