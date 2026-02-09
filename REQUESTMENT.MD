# 5D Chess Web 版需求文档

## 1. 项目概述

### 1.1 项目简介
基于 Steam 游戏《5D Chess with Multiverse Time Travel》的网页版复刻，使用现代前端技术栈实现多时间线、多维度的国际象棋游戏。

### 1.2 核心特性
- 支持时间旅行机制的国际象棋
- 多时间线并行游戏
- 跨时间线和跨时间的棋子移动
- 本地对战模式（单机双人/AI）
- 在线多人对战（基于房间系统）
- 无需用户注册，房间号+密码即可游玩

### 1.3 技术栈
- **前端**: React 18+ + TypeScript + Vite
- **状态管理**: Zustand / Jotai
- **UI 框架**: Tailwind CSS + shadcn/ui
- **3D 渲染**: Three.js / React Three Fiber（可选，用于可视化）
- **后端**: Supabase (PostgreSQL + Realtime + Storage)
- **部署**: Vercel

---

## 2. 游戏机制分析

### 2.1 5D Chess 核心概念

#### 2.1.1 五个维度
1. **X轴** - 棋盘横向（a-h列）
2. **Y轴** - 棋盘纵向（1-8行）
3. **时间轴（T）** - 回合数（向过去或未来移动）
4. **时间线轴（L）** - 不同的平行时间线
5. **玩家回合** - 白方/黑方交替

#### 2.1.2 时间旅行规则
- **向过去移动**: 棋子可以移动到之前的回合，创建新的时间线分支
- **跨时间线移动**: 棋子可以在不同的平行时间线间移动
- **时间悖论防御**: 必须在所有时间线上同时将死对方国王才能获胜

#### 2.1.3 棋子移动类型
1. **空间移动** - 普通的棋盘移动
2. **时间移动** - 向过去/未来的回合移动
3. **时间线移动** - 跨越不同时间线
4. **组合移动** - 同时在多个维度移动

---

## 3. 功能需求

### 3.1 游戏模式

#### 3.1.1 本地对战模式
- **单机双人**: 在同一设备上轮流操作
- **本地AI对战**: 与电脑对弈（不同难度级别）
  - 简单: 只考虑当前时间线
  - 中等: 考虑2-3条时间线
  - 困难: 完整的多时间线策略

#### 3.1.2 在线多人模式
- **房间创建**
  - 生成6位房间号（如: ABC123）
  - 设置房间密码（可选，4-16位）
  - 选择游戏设置（时间限制、起始布局等）
  
- **房间加入**
  - 输入房间号
  - 输入密码（如果有）
  - 自动匹配对手

- **实时同步**
  - 棋局状态实时同步
  - 对手操作即时显示
  - 断线重连机制

### 3.2 核心游戏功能

#### 3.2.1 棋盘系统
- 多时间线棋盘渲染
- 时间线树状可视化
- 回合历史追踪
- 棋盘导航和缩放

#### 3.2.2 棋子操作
- 拖拽移动棋子
- 高亮合法移动位置
- 显示可能的时间旅行路径
- 移动预览和撤销

#### 3.2.3 时间线管理
- 自动生成新时间线
- 时间线分支可视化
- 时间线间的因果关系显示
- 时间线折叠/展开

#### 3.2.4 游戏控制
- 悔棋（仅本地模式）
- 认输
- 求和
- 保存/加载棋局（本地）
- 导出棋谱

### 3.3 UI/UX 功能

#### 3.3.1 主界面
- 游戏模式选择
- 设置面板
- 教程入口
- 棋局历史（本地）

#### 3.3.2 游戏界面
- 多时间线棋盘视图
- 时间轴导航器
- 回合计数器
- 移动历史列表
- 当前玩家指示器
- 计时器（可选）

#### 3.3.3 辅助功能
- 移动提示系统
- 将军/将死提醒
- 时间线关系图
- 移动记录器
- 导出为图像/GIF

---

## 4. 技术架构

### 4.1 前端架构

```
src/
├── components/          # React 组件
│   ├── Board/          # 棋盘相关组件
│   │   ├── ChessBoard.tsx
│   │   ├── ChessPiece.tsx
│   │   ├── TimelineView.tsx
│   │   └── MoveIndicator.tsx
│   ├── UI/             # UI 组件
│   │   ├── GameMenu.tsx
│   │   ├── MoveHistory.tsx
│   │   ├── PlayerInfo.tsx
│   │   └── TimerDisplay.tsx
│   └── Room/           # 房间系统
│       ├── RoomCreate.tsx
│       ├── RoomJoin.tsx
│       └── RoomLobby.tsx
├── game/               # 游戏逻辑
│   ├── engine/
│   │   ├── GameState.ts
│   │   ├── MoveValidator.ts
│   │   ├── TimelineManager.ts
│   │   └── WinCondition.ts
│   ├── pieces/
│   │   ├── Piece.ts
│   │   ├── Pawn.ts
│   │   ├── Knight.ts
│   │   └── ...
│   └── ai/
│       └── ChessAI.ts
├── store/              # 状态管理
│   ├── gameStore.ts
│   ├── roomStore.ts
│   └── settingsStore.ts
├── services/           # 服务层
│   ├── supabase.ts
│   ├── roomService.ts
│   └── realtimeService.ts
├── types/              # TypeScript 类型
│   ├── game.types.ts
│   ├── timeline.types.ts
│   └── room.types.ts
└── utils/              # 工具函数
    ├── moveNotation.ts
    ├── boardUtils.ts
    └── timelineUtils.ts
```

### 4.2 数据结构设计

#### 4.2.1 核心数据类型

```typescript
// 位置坐标（5D）
interface Position5D {
  x: number;        // 0-7 (a-h)
  y: number;        // 0-7 (1-8)
  timeline: number; // 时间线ID
  turn: number;     // 回合数
}

// 棋子
interface Piece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  position: Position5D;
  hasMoved: boolean;
  createdAt?: Position5D; // 该棋子首次出现的时空坐标
}

// 移动
interface Move {
  id: string;
  piece: Piece;
  from: Position5D;
  to: Position5D;
  capturedPiece?: Piece;
  createsTimeline?: number; // 是否创建新时间线
  timestamp: number;
}

// 时间线
interface Timeline {
  id: number;
  parentTimeline: number | null; // 父时间线ID
  branchTurn: number;            // 从哪个回合分支
  boards: Map<number, Board>;    // 回合号 -> 棋盘状态
  isActive: boolean;
}

// 棋盘状态
interface Board {
  pieces: Piece[];
  turn: number;
  timeline: number;
}

// 游戏状态
interface GameState {
  timelines: Map<number, Timeline>;
  currentTimeline: number;
  currentTurn: number;
  currentPlayer: 'white' | 'black';
  moveHistory: Move[];
  gameStatus: 'playing' | 'checkmate' | 'stalemate' | 'draw';
  winner?: 'white' | 'black';
}
```

### 4.3 Supabase 数据库设计

#### 4.3.1 表结构

```sql
-- 房间表
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
  white_player_id UUID,
  black_player_id UUID,
  game_settings JSONB DEFAULT '{}',
  
  -- 索引
  INDEX idx_room_code ON rooms(room_code),
  INDEX idx_expires_at ON rooms(expires_at)
);

-- 游戏状态表
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  game_data JSONB NOT NULL, -- 完整的 GameState JSON
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  INDEX idx_room_id ON game_states(room_id)
);

-- 移动记录表
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  player_color VARCHAR(5) NOT NULL,
  move_data JSONB NOT NULL, -- Move 对象的 JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  INDEX idx_room_moves ON moves(room_id, move_number)
);

-- 玩家会话表（临时，无需注册）
CREATE TABLE player_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT UNIQUE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_color VARCHAR(5),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  INDEX idx_session_token ON player_sessions(session_token),
  INDEX idx_room_player ON player_sessions(room_id, player_color)
);
```

#### 4.3.2 Row Level Security (RLS) 策略

```sql
-- 启用 RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;

-- 房间访问策略：知道房间号和密码即可访问
CREATE POLICY "Anyone can read rooms with correct credentials"
ON rooms FOR SELECT
USING (
  room_code IS NOT NULL
  AND (
    password_hash IS NULL 
    OR password_hash = crypt(current_setting('request.jwt.claims')::json->>'room_password', password_hash)
  )
);

-- 游戏状态访问策略
CREATE POLICY "Players can read game state"
ON game_states FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM player_sessions ps
    WHERE ps.room_id = game_states.room_id
    AND ps.session_token = current_setting('request.jwt.claims')::json->>'session_token'
  )
);

-- 玩家可以更新游戏状态（轮到自己时）
CREATE POLICY "Players can update game state on their turn"
ON game_states FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM player_sessions ps
    JOIN rooms r ON r.id = ps.room_id
    WHERE ps.room_id = game_states.room_id
    AND ps.session_token = current_setting('request.jwt.claims')::json->>'session_token'
    AND (
      (r.status = 'playing' AND ps.player_color = (game_data->>'currentPlayer'))
    )
  )
);

-- 移动记录策略
CREATE POLICY "Players can insert moves on their turn"
ON moves FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM player_sessions ps
    WHERE ps.room_id = moves.room_id
    AND ps.session_token = current_setting('request.jwt.claims')::json->>'session_token'
    AND ps.player_color = moves.player_color
  )
);
```

### 4.4 实时同步机制

#### 4.4.1 Supabase Realtime 订阅

```typescript
// 订阅房间状态变化
const subscription = supabase
  .channel(`room:${roomCode}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'game_states',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      // 更新本地游戏状态
      updateGameState(payload.new.game_data);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'moves'
    },
    (payload) => {
      // 处理新移动
      applyMove(payload.new.move_data);
    }
  )
  .subscribe();
```

#### 4.4.2 冲突解决
- 使用乐观锁（版本号）
- 时间戳排序
- 服务端验证所有移动的合法性

---

## 5. 游戏逻辑实现

### 5.1 移动验证系统

#### 5.1.1 基本移动验证
```typescript
class MoveValidator {
  // 检查是否为合法的空间移动
  isValidSpatialMove(piece: Piece, to: Position5D, board: Board): boolean;
  
  // 检查是否为合法的时间旅行
  isValidTimeTravel(piece: Piece, to: Position5D, gameState: GameState): boolean;
  
  // 检查移动后是否导致己方被将军
  wouldCauseCheck(move: Move, gameState: GameState): boolean;
  
  // 获取所有合法移动
  getLegalMoves(piece: Piece, gameState: GameState): Position5D[];
}
```

#### 5.1.2 时间旅行规则

```typescript
class TimelineManager {
  // 创建新时间线分支
  createTimeline(
    parentTimeline: number, 
    branchTurn: number, 
    initialBoard: Board
  ): Timeline;
  
  // 检查时间旅行是否会创建新时间线
  willCreateTimeline(move: Move, gameState: GameState): boolean;
  
  // 合并已完成的时间线
  pruneTimelines(gameState: GameState): void;
  
  // 检查时间悖论
  checkParadox(gameState: GameState): boolean;
}
```

### 5.2 胜负判定

```typescript
class WinConditionChecker {
  // 检查是否将军
  isCheck(color: 'white' | 'black', gameState: GameState): boolean;
  
  // 检查是否将死（所有时间线）
  isCheckmate(color: 'white' | 'black', gameState: GameState): boolean;
  
  // 检查是否僵局
  isStalemate(gameState: GameState): boolean;
  
  // 检查是否和棋
  isDraw(gameState: GameState): boolean;
}
```

### 5.3 AI 实现（可选）

```typescript
class ChessAI {
  difficulty: 'easy' | 'medium' | 'hard';
  
  // 评估局面分数
  evaluatePosition(gameState: GameState, color: 'white' | 'black'): number;
  
  // Minimax 算法 + Alpha-Beta 剪枝
  findBestMove(
    gameState: GameState, 
    depth: number, 
    alpha: number, 
    beta: number
  ): Move;
  
  // 限制考虑的时间线数量（基于难度）
  getActiveTimelines(gameState: GameState): number[];
}
```

---

## 6. UI/UX 设计规范

### 6.1 视觉设计

#### 6.1.1 棋盘布局
- **主视图**: 显示当前时间线的棋盘
- **时间线面板**: 左侧垂直排列所有时间线
- **时间轴**: 顶部横向显示回合进度
- **缩略图**: 其他时间线显示为小型棋盘

#### 6.1.2 颜色方案
```css
/* 主题色 */
--primary: #3b82f6;      /* 蓝色 - 当前时间线 */
--secondary: #8b5cf6;    /* 紫色 - 时间旅行 */
--success: #10b981;      /* 绿色 - 合法移动 */
--danger: #ef4444;       /* 红色 - 将军/危险 */
--warning: #f59e0b;      /* 橙色 - 警告 */

/* 棋盘色 */
--board-light: #f0d9b5;
--board-dark: #b58863;
--board-highlight: #baca44;
--board-check: #ff6b6b;
```

#### 6.1.3 动画效果
- 棋子移动: 300ms ease-in-out
- 时间线创建: 淡入 + 滑动
- 高亮显示: 脉冲动画
- 页面转场: 200ms fade

### 6.2 交互设计

#### 6.2.1 棋子操作
1. **点击选择** → 高亮合法移动
2. **拖拽移动** → 实时预览路径
3. **时间旅行** → 显示目标时间线和回合
4. **确认移动** → 双击或确认按钮

#### 6.2.2 视角控制
- 鼠标滚轮: 缩放
- 拖拽空白区域: 平移画布
- 快捷键: 
  - `Space`: 居中视图
  - `←/→`: 切换时间线
  - `↑/↓`: 前后回合
  - `Z`: 撤销（仅本地）

### 6.3 响应式设计
- 桌面端 (>1024px): 完整布局
- 平板端 (768px-1024px): 简化时间线面板
- 移动端 (<768px): 单时间线视图 + 抽屉菜单

---

## 7. 房间系统实现

### 7.1 房间生命周期

```typescript
// 1. 创建房间
async function createRoom(settings: GameSettings): Promise<Room> {
  const roomCode = generateRoomCode(); // 生成6位代码
  const passwordHash = settings.password 
    ? await hashPassword(settings.password) 
    : null;
  
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      password_hash: passwordHash,
      game_settings: settings,
      status: 'waiting'
    })
    .select()
    .single();
  
  return data;
}

// 2. 加入房间
async function joinRoom(
  roomCode: string, 
  password?: string
): Promise<PlayerSession> {
  // 验证房间和密码
  const room = await validateRoom(roomCode, password);
  
  // 创建玩家会话
  const sessionToken = generateSessionToken();
  const playerColor = room.white_player_id ? 'black' : 'white';
  
  const { data } = await supabase
    .from('player_sessions')
    .insert({
      session_token: sessionToken,
      room_id: room.id,
      player_color: playerColor
    })
    .select()
    .single();
  
  // 更新房间玩家ID
  await supabase
    .from('rooms')
    .update({ 
      [`${playerColor}_player_id`]: data.id,
      status: room.black_player_id && room.white_player_id 
        ? 'playing' 
        : 'waiting'
    })
    .eq('id', room.id);
  
  return data;
}

// 3. 心跳检测
async function heartbeat(sessionToken: string): Promise<void> {
  await supabase
    .from('player_sessions')
    .update({ last_heartbeat: new Date().toISOString() })
    .eq('session_token', sessionToken);
}

// 4. 清理过期房间（Supabase Edge Function）
async function cleanupExpiredRooms(): Promise<void> {
  await supabase
    .from('rooms')
    .delete()
    .lt('expires_at', new Date().toISOString());
}
```

### 7.2 断线重连

```typescript
class ReconnectionManager {
  private sessionToken: string;
  private reconnectAttempts = 0;
  private maxAttempts = 5;
  
  async reconnect(): Promise<boolean> {
    while (this.reconnectAttempts < this.maxAttempts) {
      try {
        // 恢复会话
        const session = await this.restoreSession(this.sessionToken);
        
        // 重新订阅 Realtime
        await this.resubscribeToRoom(session.room_id);
        
        // 同步游戏状态
        await this.syncGameState();
        
        return true;
      } catch (error) {
        this.reconnectAttempts++;
        await this.delay(1000 * Math.pow(2, this.reconnectAttempts));
      }
    }
    return false;
  }
}
```

---

## 8. 性能优化

### 8.1 前端优化
- **虚拟化渲染**: 仅渲染可见的时间线和棋盘
- **Memo 化**: React.memo 缓存不变的组件
- **Web Workers**: 将 AI 计算移至后台线程
- **Code Splitting**: 按路由懒加载组件

### 8.2 网络优化
- **增量更新**: 仅发送变化的数据
- **压缩**: 使用 gzip/brotli 压缩 JSON
- **防抖**: 限制实时同步频率
- **预测同步**: 乐观更新 + 服务端验证

### 8.3 数据库优化
- **索引**: 为频繁查询的字段添加索引
- **分页**: 移动历史分页加载
- **缓存**: Supabase Edge Caching
- **归档**: 将已完成的游戏移至归档表

---

## 9. 开发路线图

### Phase 1: 核心功能 (4-6周)
**Week 1-2: 基础架构**
- ✅ 项目初始化和技术栈配置
- ✅ 基础 UI 框架搭建
- ✅ Supabase 项目创建和数据库设计
- ✅ 数据类型定义

**Week 3-4: 游戏引擎**
- ✅ 2D 棋盘渲染
- ✅ 基础棋子移动逻辑
- ✅ 移动验证系统
- ✅ 本地单机对战模式

**Week 5-6: 时间机制**
- ✅ 时间线管理系统
- ✅ 时间旅行移动验证
- ✅ 多时间线可视化
- ✅ 胜负判定逻辑

### Phase 2: 多人联机 (3-4周)
**Week 7-8: 房间系统**
- ✅ 房间创建/加入功能
- ✅ Supabase RLS 配置
- ✅ 会话管理
- ✅ 实时同步基础

**Week 9-10: 联机优化**
- ✅ 断线重连机制
- ✅ 移动冲突解决
- ✅ 延迟优化
- ✅ 心跳检测

### Phase 3: 功能完善 (2-3周)
**Week 11-12: 用户体验**
- ✅ 移动提示系统
- ✅ 教程和帮助文档
- ✅ 音效和视觉反馈
- ✅ 移动动画

**Week 13: AI 对手（可选）**
- ✅ 基础 AI 实现
- ✅ 难度调节
- ✅ 性能优化

### Phase 4: 测试与优化 (2周)
**Week 14: 测试**
- ✅ 单元测试
- ✅ 集成测试
- ✅ 多人测试
- ✅ 性能测试

**Week 15: 部署**
- ✅ 生产环境配置
- ✅ CI/CD 流程
- ✅ 监控和日志
- ✅ 正式发布

---

## 10. 风险与挑战

### 10.1 技术挑战
1. **复杂度管理**: 5D 移动逻辑极其复杂
   - **解决方案**: 分层设计，充分的单元测试
   
2. **性能问题**: 大量时间线时的渲染性能
   - **解决方案**: 虚拟化、懒加载、Web Workers

3. **实时同步**: 低延迟的多人同步
   - **解决方案**: Supabase Realtime + 乐观更新

### 10.2 游戏设计挑战
1. **学习曲线**: 5D Chess 对新手非常困难
   - **解决方案**: 详细教程、分步引导、练习模式

2. **UI 可读性**: 多时间线显示容易混乱
   - **解决方案**: 清晰的视觉层次、颜色编码、交互提示

### 10.3 安全性考虑
1. **作弊防护**: 客户端可被修改
   - **解决方案**: 服务端验证所有移动

2. **DDoS 防护**: 恶意创建大量房间
   - **解决方案**: 速率限制、房间过期机制

---

## 11. 可选扩展功能

### 11.1 高级功能
- 📊 **统计分析**: ELO 评分系统
- 🎯 **每日挑战**: 特定的谜题和场景
- 🏆 **成就系统**: 游戏里程碑
- 📱 **移动 App**: React Native 版本
- 🎨 **自定义主题**: 棋盘和棋子皮肤
- 💬 **聊天系统**: 游戏内实时聊天

### 11.2 社区功能
- 📺 **观战模式**: 观看他人对局
- 🎥 **录像回放**: 保存和分享精彩对局
- 📚 **棋谱库**: 学习高手对局
- 👥 **好友系统**: 添加好友并邀请对战

---

## 12. 测试策略

### 12.1 单元测试
```typescript
// 测试移动验证
describe('MoveValidator', () => {
  test('should validate basic pawn move', () => {
    const move = createMove(pawn, {x: 0, y: 1}, {x: 0, y: 2});
    expect(validator.isValid(move, gameState)).toBe(true);
  });
  
  test('should detect time travel', () => {
    const move = createMove(knight, 
      {x: 1, y: 0, timeline: 1, turn: 5},
      {x: 2, y: 2, timeline: 1, turn: 3}
    );
    expect(validator.isValidTimeTravel(move, gameState)).toBe(true);
  });
});
```

### 12.2 集成测试
- 完整游戏流程测试
- 多时间线场景测试
- 房间系统端到端测试

### 12.3 性能测试
- 100+ 时间线渲染性能
- 网络延迟模拟
- 并发用户压力测试

---

## 13. 部署清单

### 13.1 环境变量
```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# 应用配置
VITE_APP_URL=https://5dchess.app
VITE_ROOM_EXPIRY_HOURS=24
VITE_MAX_TIMELINES=50
```

### 13.2 Vercel 配置
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### 13.3 监控
- Sentry: 错误追踪
- Vercel Analytics: 性能监控
- Supabase Logs: 数据库日志

---

## 14. 文档和资源

### 14.1 开发文档
- 游戏规则完整说明
- API 接口文档
- 组件使用指南
- 贡献指南

### 14.2 用户文档
- 新手教程
- 常见问题 FAQ
- 快捷键列表
- 故障排除

### 14.3 参考资源
- [5D Chess 官方规则](https://store.steampowered.com/app/1349230/)
- [Chess.js](https://github.com/jhlywa/chess.js) - 象棋引擎参考
- [Supabase 文档](https://supabase.com/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - 3D 渲染

---

## 15. 总结

这是一个极具挑战性但非常有趣的项目。关键成功因素：

1. **清晰的架构**: 分离游戏逻辑和 UI
2. **渐进开发**: 先实现核心功能，再添加多人模式
3. **充分测试**: 复杂逻辑需要全面的测试覆盖
4. **性能优化**: 从一开始就考虑性能问题
5. **用户体验**: 降低学习曲线，提供良好的反馈

**预估开发时间**: 3-4个月（1-2名全职开发者）

**核心难点**:
- 时间旅行逻辑的正确实现
- 多时间线的性能优化
- 直观的 UI 设计
