# TypingGames 项目背景与决策记录

> 本文件用于让未来的 Claude Code 会话快速对齐项目目标、已做决策和当前进度。
> 文件名必须是 `CLAUDE.md`（全大写），Claude Code 才会自动加载为项目上下文。

---

## 一、项目目标

- **变现模型**：海外英文游戏 iframe 站群矩阵（不是攻略站，不是工具站）
- **核心诉求**：快速赚钱、收入越多越好
- **预期路径**：12 个月做到 $3k-8k/月，24 个月做到 $15k-40k/月
- **首站定位**：Typing Games（打字游戏）—— 作为整个矩阵的先锋兵

---

## 二、已对比并确定的方向

### 比较过的赛道
- 蹭热点流量站 → 传统模型已死，纯采集站不做
- 海外英文工具站 → 可行但非首选
- 游戏攻略站 → 可行但更新负担重、依赖游戏寿命
- **游戏 iframe 站 → 最终选择**
- 单站 vs 站群矩阵 → **选择站群 2.0 模型**

### 为什么选 iframe 站
- AI 搜索抢不走"我要立刻玩"的意图（避风港）
- 用户停留时间长（10-30 分钟/session），广告展示模型最爱
- 内容生产成本极低（嵌入即上线）
- 一套模板可复制成站群

### 为什么 Typing Games 作为首站
- 受众健康（教育向 + 办公场景），AdSense / Mediavine 全部友好
- RPM 高（$8-15）
- 工具型 + 游戏型混合，留存极佳
- 顶部 SaaS 化（Typing.com、Nitro Type 是订阅），免费 iframe 聚合有切入空间
- 最容易过广告审核 → 最快见现金流

---

## 三、最终架构：「站群 2.0」

不是 8 个垃圾换皮站，而是 **3-5 个真站 + 共享后端**。

### 站群规划

```
共享后端（一份代码，复用到所有站）：
  - 游戏数据库（GameDistribution + GameMonetize Feed 整合）
  - 推荐算法
  - Next.js 组件库
  - CMS 后台

5 个独立前端站：
  Site 1: TypingGames     ← 当前项目，先做这个
  Site 2: Idle / Clicker
  Site 3: Unblocked
  Site 4: Retro Flash (Ruffle 引擎)
  Site 5: Daily Puzzle / -dle 类
```

### 独立性保障（防止被 Google 判为 PBN）
- 不同 Cloudflare 账号 / 不同 hosting IP
- 不同 GSC / Analytics / AdSense 账号
- 不同 WHOIS（开 privacy）
- **完全不互链**
- 各站有独立 logo / 配色 / 文案语气

### 为什么是 3-5 个不是 8-10 个
- 一人精力极限是 5 个站的内容质量
- Google 对 5 个差异化真站的容忍度远高于 10 个换皮站

---

## 四、Typing Games 站点选品细节

### 关键词机会清单

| 关键词 | 月搜估算 | 竞争 | 备注 |
|---|---|---|---|
| `typing games` | 100k-200k | 高 | Typing.com / Nitro Type 占大头 |
| `typing games for kids` | 30k-60k | 中 | 受众明确 |
| `typing test` | 500k-1M | 极高 | 不直攻，做 alternative |
| `monkeytype alternative` | 5k-15k | 低 | "alternative"打法 |
| `typing speed game` | 20k-40k | 中 | 长尾 |
| `typing games unblocked` | 30k-60k | 中 | 跨品类联动 |
| `typing games for adults` | 10k-20k | 低-中 | 蓝海受众 |
| `typing race / typing battle` | 5k-15k | 低 | 玩法词 |

> 实操前必须用 Ahrefs / Semrush 自己复核搜索量。

### 域名思路
- `type[word].com`：例 `typequest.com`、`speedtypehub.com`
- 短 + 好记 + 关键词友好

---

## 五、技术栈（已确定）

```
框架:    Next.js (App Router) + ISR
样式:    Tailwind
游戏库:  GameDistribution / GameMonetize Feed API
数据库:  Postgres / SQLite（游戏 metadata + 分类 + 标签）
搜索:    MeiliSearch（站内搜索是留存关键）
缓存:    Cloudflare Pages（免费 + 全球 CDN）
图片:    Cloudflare Images / Imgix
广告:    Ezoic → SnigelWeb / Playwire（专门服务游戏站）
分析:    Plausible + 自建游戏内事件追踪
合规:    Cookie consent (GDPR) + age gate (COPPA)
```

### 关键技术约束
- 每个游戏一个独立 URL `/game/[slug]/`（SEO 命脉）
- 游戏页 SSR + `VideoGame` schema.org 结构化数据
- 缩略图必须自建 CDN（不直链发行商图床）
- 站内推荐：玩完 A 推 B C D（拉高 PV/Session）

---

## 六、变现路径

| 月 UV | 广告方案 | 月收入预估 |
|---|---|---|
| 0-10k | AdSense | $20-200 |
| 10k-100k | Ezoic | $200-2000 |
| 100k-500k | Mediavine / SnigelWeb | $2k-15k |
| 500k+ | Raptive / Playwire + Pro 会员 | $15k+ |

### Pro 会员升级（流量到 10 万 UV/月再上）
- 免费：基础工具 + 广告 + 文件大小限制
- Pro $5-9/月：去广告 + 大文件 + 批量处理 + API

### 联盟（次要现金流，10-30%）
- 游戏本体 CDKey（Eneba、Kinguin、Instant Gaming）
- 外设（Razer、罗技）
- 教育向 SaaS（针对 Typing 站）

---

## 七、执行节奏

### Month 1-2：搭共享后端 + Typing 站
- 跑通 Next.js + GameDistribution Feed
- 推荐算法 + SEO 模板
- 上线 100+ 游戏页（先求量）
- GSC + Bing Webmaster + Plausible 数据闭环

### Month 3-4：上 Site 2 (Idle) 和 Site 3 (Unblocked)
- 模板复用，每站 3-4 周
- 每站独立账号 + 独立 IP

### Month 5-6：上 Site 4 (Retro) 和 Site 5 (Puzzle)
- 按前 3 站数据决定优先级

### Month 7-12：优化 + 加杠杆
- 流量好的站升级广告联盟
- 流量差的站决定 kill 还是 pivot
- 跑通后开**小语种镜像**（西/葡/印尼）—— 放大收入的关键步骤

### 收入轨迹（中等运气）
- Month 6：3 站，5-15 万 UV，$500-1500/月
- Month 12：5 站，30-80 万 UV，$3k-8k/月
- Month 18：5 站 + 5 小语种，80-200 万 UV，$8k-20k/月
- Month 24：10 站稳态，150-400 万 UV，$15k-40k/月

---

## 八、重大风险（Claude 做决策时要随时考虑）

1. **Google 反站群越来越严**（2024-2025 多次更新）
   - 必须做出真正不同的站，不能简单换皮
   - 不能互链

2. **广告联盟政策**
   - Mediavine 拒收纯儿童站
   - AdSense 对游戏站审核严，尤其儿童向（COPPA / GDPR-K）

3. **游戏来源合规**
   - 优先用：GameDistribution、GameMonetize、CrazyGames Developer API
   - 不要碰：盗版 Flash 复刻、Unity WebGL 私自破解版
   - 直接嵌别人 iframe URL 风险高（referer 屏蔽 / 法律警告）

4. **前 2-3 个月无收入**
   - 必须扛过冷启动期
   - 资金/耐心是硬门槛

---

## 九、当前进度

- [x] 确定整体战略（站群 2.0）
- [x] 选定首站方向（Typing Games）
- [x] 完成关键词初步调研
- [x] 创建项目文件夹
- [ ] 用 Ahrefs / Semrush 复核关键词搜索量
- [ ] 注册域名
- [ ] 申请 GameDistribution / GameMonetize 开发者账号
- [ ] 搭建 Next.js 项目骨架
- [ ] 设计游戏数据 schema
- [ ] 上线第一批 100 个游戏页
- [ ] 提交 GSC + Bing Webmaster
- [ ] 接入 Plausible 分析
- [ ] 流量过 1 万 UV → 申请 Ezoic

---

## 十、给未来 Claude 会话的指引

- 用户目标是**快速变现**，不要建议长期慢养品牌的路线
- 用户已确定走**站群矩阵**，不要再讨论"是否要做单站"
- 当前优先级是**先把 Typing 站跑通**，不要并行铺 5 个站
- 涉及 SEO 决策时，记住已对比过的赛道结论（攻略站 / 工具站已排除）
- 涉及技术栈决策时，已确定 Next.js + Cloudflare Pages，不要建议 WordPress
- 涉及广告联盟时，已规划路径 AdSense → Ezoic → SnigelWeb/Playwire
- 收入数据全部是基于公开 SEO 工具的估算区间，给具体建议前应提醒用户自验
