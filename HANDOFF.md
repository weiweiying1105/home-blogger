# Home Blogger 项目移交文档

> 本文档面向接手的 AI agent / 开发者，描述项目截至 2026-10-28 的完整现状。
> 用户是内容创作者（非专业开发者），沟通语言为中文，界面文案均为中文。

## 项目是什么

个人博主的内容创作工作台：管理发布计划、图片素材、审美积累分类、四象限待办。全栈单仓库，无登录鉴权（纯个人工具，目前直接暴露在公网，见"已知问题"）。

## 技术栈

- **Next.js 15（App Router）+ React 19 + TypeScript**，页面全部是 `"use client"` 客户端组件，通过 fetch 调自己的 API 路由
- **Prisma 6 + PostgreSQL（Supabase 托管）**——2026-10-28 从本地 SQLite 迁移而来
- **Tailwind CSS 3**，stone 色系、圆角、极简风格；遵循现有风格，不要引入新 UI 库
- 图片文件存**腾讯云 COS**（缩略图由服务端用 `sharp` 生成后一并上传）
- AI 能力用**火山引擎方舟（Ark）**的视觉模型生成图片描述和候选标签（`src/lib/ai.ts`）

## 运行

```bash
npm run dev        # 开发，http://localhost:3000
npm run build      # 生产构建
npx prisma db push # 同步 schema 到数据库（改 schema.prisma 后执行）
```

`postinstall` 已配置 `prisma generate`。路径别名 `@/*` → `src/*`。

**数据库连接**：`DATABASE_URL` 在 `.env.local`（已 gitignore，本机有值），本地用 Supabase session pooler（5432 端口）；Vercel 线上用事务池（6543 + `?pgbouncer=true&connection_limit=1`）。所有密钥（Supabase 密码、COS、ARK）都在 `.env.local`，**绝不能提交进仓库或写进代码**。

## 目录结构

```
src/
├── app/
│   ├── page.tsx            # 发布计划（首页）
│   ├── images/page.tsx     # 图片管理（上传 + AI 描述/标签）
│   ├── gallery/page.tsx    # 审美积累（分类浏览图库）
│   ├── todos/page.tsx      # 待办四象限
│   ├── materials/page.tsx  # ⚠️ 孤儿页面，见"已知问题"
│   ├── layout.tsx          # 全局左侧导航（固定 w-56）
│   └── api/                # REST 路由，全部 runtime=nodejs
├── components/
│   ├── CategoryMenu.tsx    # 审美积累页的分类树菜单（自带增删/折叠/选中逻辑）
│   ├── ImagePicker.tsx     # 选图弹窗（多选）
│   └── PlanForm.tsx        # 发布计划表单
└── lib/
    ├── db.ts               # Prisma 单例
    ├── cos.ts              # 腾讯云 COS 上传（原图 + sharp 缩略图）
    └── ai.ts               # 火山方舟：describeImage() / analyzeTags()
```

## API 一览

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/categories` | GET/POST | GET 返回树形结构（children 嵌套）；POST `{name, parentId}` |
| `/api/categories/[id]` | DELETE | 级联删除 |
| `/api/images` | GET | 支持 `?category=`（**精确匹配，不含子分类**）和 `?q=`（标题/描述模糊搜索） |
| `/api/images/[id]` | PATCH/DELETE | 更新/删除 |
| `/api/images/[id]/categories` | POST/DELETE | 图-分类关联 |
| `/api/images/[id]/tags` | POST/DELETE | 图-标签关联 |
| `/api/images/[id]/analyze` | POST | 调 AI 返回候选标签（不落库，等用户确认） |
| `/api/upload` | POST | FormData 上传图片到 COS + AI 生成描述（图片管理页用） |
| `/api/upload-gallery` | POST | 上传到 COS，可选 `categoryId`（审美积累页用） |
| `/api/plans`、`/api/plans/[id]` | CRUD | 发布计划，status: draft/published |
| `/api/tags` | GET/POST | 自由标签 |
| `/api/todos`、`/api/todos/[id]` | CRUD | 四象限待办，quadrant 1-4；GET 按 order asc，POST 创建时 order=象限内现有条数 |
| `/api/todos/reorder` | POST | 拖拽排序批量提交 `{items:[{id,quadrant,order}]}`，事务一次更新；前端拖拽跨象限+象限内排序 |
| `/api/notes`、`/api/notes/[id]` | CRUD | 笔记：title/content(Markdown)/category(单层分类)；GET 列表只返回元信息（不含 content），详情走 [id] |
| `/api/bloggers` | GET/POST | 博主库；GET 按 sortOrder asc；POST 自动去重（重复 username 或命中已删除清单返回 409 + 中文提示）；username 支持填完整 Ins 主页链接（自动提取账号），未填 username 时从 homepage 兜底解析 |
| `/api/bloggers/[id]` | PUT/DELETE | 编辑（白名单字段，改 username 前查重）/ 删除（删除前自动写入 DeletedBlogger 黑名单） |
| `/api/bloggers/check` | GET | `?username=` 多通道校验 Ins 账号是否存在 |
| `/api/bloggers/deleted` | GET/DELETE | 已删除博主黑名单：GET 列表；DELETE `?username=` 移除（可重新添加） |

## 数据模型（prisma/schema.prisma）

9 个模型：`Image`、`Category`（树形自引用，parentId）、`CategoryOnImage`、`Plan`、`PlanMaterial`（Plan↔Image 多对多）、`Todo`、`Tag`、`ImageTag`、`Blogger`、`DeletedBlogger`（博主删除黑名单，username @unique，爬取导入 POST 时自动拦截）、`Note`（笔记：title/content(Markdown)/category 单层分类）。所有关联均为 `onDelete: Cascade`。ID 是 cuid 字符串。

笔记前端：`/notes`（列表+分类 pills 筛选）、`/notes/new` 与 `/notes/[id]/edit`（共用 `src/components/NoteEditor.tsx` 双栏编辑+实时预览）、`/notes/[id]`（详情，`src/components/NoteRenderer.tsx` 用 react-markdown + remark-gfm 渲染，安全转义 HTML）。

历史数据从 SQLite 迁移时的快照存在 `prisma/seed-data.json`，回放脚本 `scripts/seed-from-json.mjs`（node 直接跑，用于重置/换库）。

## 部署拓扑

```
GitHub: weiweiying1105/home-blogger (main)
   └── push 自动触发 → Vercel 部署 → https://weiyingwillsucceed.xyz
数据库: Supabase Postgres（新加坡 ap-southeast-1，项目 ref = qfzmojbijjcefpjlocnj，见 .env 的 DATABASE_URL；.env.local 里的 tbeifiacxettpstyqud 项目已删除失效，勿再使用）
图片: 腾讯云 COS ap-guangzhou
```

**本地 dev 和线上生产连的是同一个 Supabase 库（.env 的 qfzmoj 项目）**——本地改数据线上立刻可见（反之亦然）。调试时删数据要小心。

## 已知问题（接手者优先看这里）

1. **AI 功能当前不可用**：`.env.local` 里 `ARK_MODEL="ep-placeholder"` 是占位符，不是真实 endpoint id。`/api/upload` 的 AI 描述和 `/api/images/[id]/analyze` 会静默失败（前者有 try-catch 兜底，后者会直接报错）。修法：用户在火山方舟创建视觉模型接入点，把 endpoint id 填进去。
2. **孤儿页面 materials**：`src/app/materials/` 还在调 `/api/materials`，但该 API 路由已删、schema 里也没有 Material 模型，导航也没挂它。要么删掉整个目录，要么按需恢复——建议向用户确认后处理。
3. **无鉴权**：线上站点任何人可访问可写库。个人工具阶段用户已知晓并接受；如果要在公网长期暴露，建议至少加个简单密码。
4. **`/api/images?category=` 不含子分类**：审美积累页点父分类只显示直接挂在该分类下的图，不聚合子分类的图。这是设计现状，改动前先问用户是否期望父分类聚合显示。
5. **本地 dev 的 Prisma 连不上库**：Next dev 优先加载 `.env.local`，其 DATABASE_URL 指向已删除的旧 Supabase 项目（tbeifiac），导致 dev 下所有 API 500。临时解法：本地开发前把 `.env` 的 DATABASE_URL 复制覆盖 `.env.local` 的 DATABASE_URL（或删掉 .env.local 里失效值）。
6. **线上 PUT `/api/bloggers/[id]` 曾稳定 500**（GET/POST 正常）：2026-10-30 在 `[id]/route.ts` 加 try/catch 错误回传 + 编辑查重后线上实测 200 修复；原 500 的精确堆栈不可见（错误被吞），现所有 API 错误都会返回 `{error: msg}` 可读信息。

## 环境注意事项（Windows）

- dev server 运行时 `prisma generate` 会报 EPERM（query engine DLL 被占用）——先停 dev server 再 generate。
- 在 git-bash 终端用 curl 发中文 JSON 会变成 GBK 乱码写入库；测试带中文的接口请在浏览器里操作，或写 Node 脚本发请求。
- **PowerShell 里 `curl.exe -d '{"key":"value"}'` 的双引号可能被吞**（服务端收到非法 JSON 报 500）；发 JSON 请用 node 脚本（fetch）或 `--data-raw` 转义。
- `prisma/dev.db` 是 SQLite 时代的遗留文件（gitignore 中），已不再使用，勿删——是唯一本地备份。
- `npx tsc --noEmit` 当前**全绿**，保持这个基准。
- schema 变更后：`npx prisma db push`（连 .env 的线上库）→ `npx prisma generate` → 构建/推送。

## 工作流约定

- 提交信息用中文，一行概述；改动后 `git push`，Vercel 自动部署
- 线上验证：curl `https://weiyingwillsucceed.xyz/api/...` 对比本地
- `.env`、`.env.local`、`node_modules`、`prisma/dev.db`、`cloudflared.exe`、`.claude/` 均已 gitignore
- 用户偏好：改动前如遇多种合理方案，直接问用户；UI 风格沿用 stone 极简风
