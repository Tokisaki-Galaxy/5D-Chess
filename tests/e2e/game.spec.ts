import { test, expect } from "@playwright/test";

test.describe("5D Chess - Main Menu", () => {
  test("should display the game title and menu options", async ({ page }) => {
    await page.goto("/");

    // 验证标题
    const title = page.getByTestId("game-title");
    await expect(title).toBeVisible();
    await expect(title).toHaveText("5D Chess");

    // 验证菜单选项
    const menu = page.getByTestId("game-menu");
    await expect(menu).toBeVisible();
    await expect(page.getByTestId("mode-local-pvp")).toBeVisible();
    await expect(page.getByTestId("mode-local-ai")).toBeVisible();
    await expect(page.getByTestId("mode-online")).toBeVisible();

    // 截图 - 主菜单
    await page.screenshot({ path: "screenshots/01-main-menu.png" });
  });

  test("should show AI difficulty selection", async ({ page }) => {
    await page.goto("/");

    // 点击人机对战
    await page.getByTestId("mode-local-ai").click();

    // 验证难度选择出现
    await expect(page.getByTestId("ai-easy")).toBeVisible();
    await expect(page.getByTestId("ai-medium")).toBeVisible();
    await expect(page.getByTestId("ai-hard")).toBeVisible();

    // 截图 - AI难度选择
    await page.screenshot({ path: "screenshots/02-ai-difficulty.png" });
  });

  test("should navigate back from AI difficulty", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-ai").click();
    await page.getByTestId("ai-back").click();

    // 验证回到主菜单
    await expect(page.getByTestId("mode-local-pvp")).toBeVisible();
  });
});

test.describe("5D Chess - Game Board", () => {
  test("should display the chess board after starting local PvP", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-pvp").click();

    // 验证棋盘已渲染
    const board = page.getByTestId("chess-board");
    await expect(board).toBeVisible();

    // 验证回合指示器
    const turnIndicator = page.getByTestId("turn-indicator");
    await expect(turnIndicator).toContainText("白方");

    // 验证导航按钮
    await expect(page.getByTestId("back-btn")).toBeVisible();
    await expect(page.getByTestId("reset-btn")).toBeVisible();

    // 截图 - 初始棋盘
    await page.screenshot({ path: "screenshots/03-initial-board.png" });
  });

  test("should highlight legal moves when clicking a piece", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-pvp").click();

    // 点击白方的e2兵 (x=4, y=1)
    await page.getByTestId("square-4-1").click();

    // 截图 - 选中棋子和合法移动高亮
    await page.screenshot({ path: "screenshots/04-piece-selected.png" });
  });

  test("should move a piece and switch turns", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-pvp").click();

    // 白方 e2-e4: 点击e2(4,1)，然后点击e4(4,3)
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // 验证回合切换到黑方
    const turnIndicator = page.getByTestId("turn-indicator");
    await expect(turnIndicator).toContainText("黑方");

    // 截图 - 移动后状态
    await page.screenshot({ path: "screenshots/05-after-move.png" });
  });

  test("should show move history after a move", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-pvp").click();

    // 白方 e2-e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // 验证移动历史
    const moveHistory = page.getByTestId("move-history");
    await expect(moveHistory).toContainText("e2");
    await expect(moveHistory).toContainText("e4");

    // 截图 - 移动历史
    await page.screenshot({
      path: "screenshots/06-move-history.png",
      fullPage: true,
    });
  });

  test("should navigate back to menu", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-pvp").click();
    await page.getByTestId("back-btn").click();

    // 验证回到菜单
    await expect(page.getByTestId("game-title")).toBeVisible();
  });

  test("should reset the game", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-pvp").click();

    // 走一步
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // 重置
    await page.getByTestId("reset-btn").click();

    // 验证回到白方回合
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");
  });
});
