# Proofboard 后端文件说明

## 文件清单

```
backend/
├── main.py                        → FastAPI 后端（Python）
├── fastapi.env                    → FastAPI .env 文件（重命名为 .env 放到 AI 目录）
├── nextjs.env.local               → Next.js 环境变量（重命名为 .env.local）
└── api_routes/
    ├── parse-pdf/route.ts         → Next.js API: POST /api/parse-pdf
    ├── evaluate/route.ts          → Next.js API: POST /api/evaluate
    └── transcribe/route.ts        → Next.js API: POST /api/transcribe
```

---

## 部署方法

### 1. FastAPI 后端

**文件位置：** `c:\Users\ssycz\Desktop\AI\main.py`

**环境变量：** 将 `fastapi.env` 重命名为 `.env`，放入同目录

**安装依赖：**
```bash
pip install fastapi uvicorn python-multipart python-dotenv requests pdfplumber
```

**启动：**
```bash
cd c:\Users\ssycz\Desktop\AI
uvicorn main:app --reload
# 访问 http://127.0.0.1:8000/docs 查看 API 文档
```

---

### 2. Next.js API Routes

**文件位置：**
```
project_extract/project_extract/app/api/
├── parse-pdf/route.ts
├── evaluate/route.ts
└── transcribe/route.ts
```

**环境变量：** 将 `nextjs.env.local` 重命名为 `.env.local`，放入 Next.js 项目根目录

**安装依赖：**
```bash
cd c:\Users\ssycz\Desktop\project_extract\project_extract
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

**启动：**
```bash
npm run dev
# 访问 http://localhost:3000
```

---

## API 接口汇总

### FastAPI（端口 8000）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/session/create` | POST | 创建会话 |
| `/api/session/{id}` | GET | 获取会话 |
| `/api/session/{id}/proof-cards` | GET | 获取历史卡片 |
| `/api/pdf/extract` | POST | 提取 PDF 文字 |
| `/api/pdf/generate-graph` | POST | 生成知识图谱 |
| `/api/asr` / `/api/transcribe` | POST | 语音转文字 |
| `/api/score` / `/api/evaluate` | POST | AI 综合评分 |
| `ws://…/ws/conversation` | WS | 实时对话 |
| `ws://…/ws/audio-stream` | WS | 音频流转写 |

### Next.js API Routes（端口 3000）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/parse-pdf` | POST | PDF → Concept JSON |
| `/api/evaluate` | POST | 评估 transcript |
| `/api/transcribe` | POST | 音频 → 文字 |

---

## WebSocket 消息协议（/ws/conversation）

**客户端 → 服务端：**
```json
{ "type": "start", "session_id": "...", "section_id": "..." }
{ "type": "score", "answer": "用户说的话", "knowledge_context": "..." }
{ "type": "audio", "chunk": "hex格式音频块" }
{ "type": "transcribe" }
{ "type": "ping" }
```

**服务端 → 客户端：**
```json
{ "type": "start", "content": "...", "knowledge_outline": {...} }
{ "type": "score_result", "data": { "score": 85, "covered": [...], "missing": [...], ... } }
{ "type": "transcript", "content": "转写文字" }
{ "type": "status", "content": "状态消息" }
{ "type": "error", "content": "错误信息" }
{ "type": "pong" }
```
