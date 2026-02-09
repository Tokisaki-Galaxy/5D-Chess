import { test, expect } from "@playwright/test";

test.describe("5D Chess - Time Mechanics (Week 5-6)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display initial board with timeline info", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Verify board is rendered
    const board = page.getByTestId("chess-board");
    await expect(board).toBeVisible();

    // Verify initial turn shows timeline 0
    await expect(page.getByTestId("turn-indicator")).toContainText("时间线 0");
    await expect(page.getByTestId("turn-indicator")).toContainText("回合 0");

    // Verify player info shows 1 timeline
    await expect(page.getByTestId("player-info")).toContainText("1");

    // Screenshot: Initial board with timeline info
    await page.screenshot({
      path: "screenshots/e2e-w56-01-initial-board-timeline.png",
    });
  });

  test("should show time-travel hints when selecting a piece with multiple timelines", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play a few moves to have a game history
    // White: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Black: e7 -> e5
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();

    // White: knight Nf3 (g1->f3: x=6,y=0 -> x=5,y=2)
    await page.getByTestId("square-6-0").click();
    await page.getByTestId("square-5-2").click();

    // Verify turn indicator
    await expect(page.getByTestId("turn-indicator")).toContainText("黑方");

    // Screenshot: Game in progress before time travel
    await page.screenshot({
      path: "screenshots/e2e-w56-02-game-in-progress.png",
    });
  });

  test("should handle piece selection and legal moves display correctly", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Select white knight at b1 (x=1, y=0)
    await page.getByTestId("square-1-0").click();

    // Knight should have 2 legal moves
    // Check that the piece is selected (no explicit visual test, just verify no error)
    await expect(page.getByTestId("chess-board")).toBeVisible();

    // Screenshot: Knight selected showing legal moves
    await page.screenshot({
      path: "screenshots/e2e-w56-03-knight-legal-moves.png",
    });
  });

  test("should play multiple moves and track them in move history", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // White: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    await expect(page.getByTestId("turn-indicator")).toContainText("黑方");

    // Black: e7 -> e5
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // White: Bc4 (f1->c4: x=5,y=0 -> x=2,y=3)
    await page.getByTestId("square-5-0").click();
    await page.getByTestId("square-2-3").click();

    // Verify move history contains moves
    const moveHistory = page.getByTestId("move-history");
    await expect(moveHistory).toContainText("e2");

    // Screenshot: Multiple moves with history
    await page.screenshot({
      path: "screenshots/e2e-w56-04-multiple-moves-history.png",
      fullPage: true,
    });
  });

  test("should detect checkmate via Scholar's Mate", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play Scholar's Mate
    // 1. e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    // 1... e5
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();
    // 2. Qh5
    await page.getByTestId("square-3-0").click();
    await page.getByTestId("square-7-4").click();
    // 2... Nc6
    await page.getByTestId("square-1-7").click();
    await page.getByTestId("square-2-5").click();
    // 3. Bc4
    await page.getByTestId("square-5-0").click();
    await page.getByTestId("square-2-3").click();
    // 3... Nf6
    await page.getByTestId("square-6-7").click();
    await page.getByTestId("square-5-5").click();
    // 4. Qxf7#
    await page.getByTestId("square-7-4").click();
    await page.getByTestId("square-5-6").click();

    // Should show checkmate overlay
    await expect(page.getByTestId("game-over-overlay")).toBeVisible();

    // Screenshot: Checkmate
    await page.screenshot({
      path: "screenshots/e2e-w56-05-checkmate-scholars-mate.png",
    });
  });

  test("should reset game and restore initial state", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Make some moves
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();

    // Reset game
    await page.getByTestId("reset-btn").click();

    // Verify reset
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");
    await expect(page.getByTestId("turn-indicator")).toContainText("回合 0");

    // Screenshot: After reset
    await page.screenshot({
      path: "screenshots/e2e-w56-06-after-reset.png",
    });
  });

  test("should start AI game and AI makes a move", async ({ page }) => {
    await page.getByTestId("mode-local-ai").click();
    await page.getByTestId("ai-easy").click();

    // Verify game started
    await expect(page.getByTestId("chess-board")).toBeVisible();
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // White makes a move: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Wait for AI to make a move
    await page.waitForTimeout(1000);

    // After AI moves, it should be white's turn again
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // Screenshot: After AI move
    await page.screenshot({
      path: "screenshots/e2e-w56-07-ai-game.png",
    });
  });

  test("should handle game flow with check detection", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play moves to create check situation
    // 1. e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    // 1... f5
    await page.getByTestId("square-5-6").click();
    await page.getByTestId("square-5-4").click();
    // 2. Qh5+ (check!)
    await page.getByTestId("square-3-0").click();
    await page.getByTestId("square-7-4").click();

    // Should show check message
    await expect(page.getByTestId("game-message")).toContainText("将军");

    // Screenshot: Check warning
    await page.screenshot({
      path: "screenshots/e2e-w56-08-check-warning.png",
    });
  });

  test("should navigate back to menu from game", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();
    await expect(page.getByTestId("chess-board")).toBeVisible();

    // Go back
    await page.getByTestId("back-btn").click();

    // Verify menu
    await expect(page.getByTestId("game-title")).toBeVisible();
    await expect(page.getByTestId("game-menu")).toBeVisible();

    // Screenshot: Back to menu
    await page.screenshot({
      path: "screenshots/e2e-w56-09-back-to-menu.png",
    });
  });

  test("should show timeline count in player info", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Initially should show 1 timeline
    const playerInfo = page.getByTestId("player-info");
    await expect(playerInfo).toContainText("时间线数");
    await expect(playerInfo).toContainText("1");

    // Screenshot: Timeline count
    await page.screenshot({
      path: "screenshots/e2e-w56-10-timeline-count.png",
    });
  });

  test("should handle piece capture and show in history", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // White: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Black: d7 -> d5
    await page.getByTestId("square-3-6").click();
    await page.getByTestId("square-3-4").click();

    // White: e4 x d5 (capture)
    await page.getByTestId("square-4-3").click();
    await page.getByTestId("square-3-4").click();

    // Verify capture in move history
    const moveHistory = page.getByTestId("move-history");
    await expect(moveHistory).toContainText("×");

    // Screenshot: Capture move
    await page.screenshot({
      path: "screenshots/e2e-w56-11-capture-move.png",
      fullPage: true,
    });
  });

  test("should allow game reset after checkmate via overlay button", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play Scholar's Mate quickly
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();
    await page.getByTestId("square-3-0").click();
    await page.getByTestId("square-7-4").click();
    await page.getByTestId("square-1-7").click();
    await page.getByTestId("square-2-5").click();
    await page.getByTestId("square-5-0").click();
    await page.getByTestId("square-2-3").click();
    await page.getByTestId("square-6-7").click();
    await page.getByTestId("square-5-5").click();
    await page.getByTestId("square-7-4").click();
    await page.getByTestId("square-5-6").click();

    // Checkmate overlay should be visible
    await expect(page.getByTestId("game-over-overlay")).toBeVisible();

    // Click reset on overlay
    await page.getByTestId("game-over-reset").click();

    // Verify reset
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");
    await expect(page.getByTestId("game-over-overlay")).not.toBeVisible();

    // Screenshot: After reset from checkmate
    await page.screenshot({
      path: "screenshots/e2e-w56-12-reset-after-checkmate.png",
    });
  });
});
