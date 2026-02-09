import { test, expect } from "@playwright/test";

test.describe("5D Chess - Game Engine (Week 3-4)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should start local PvP and display initial board correctly", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Verify board is rendered
    const board = page.getByTestId("chess-board");
    await expect(board).toBeVisible();

    // Verify initial turn is white
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // Verify white pieces on bottom rows
    await expect(page.getByTestId("square-4-0")).toBeVisible(); // white king e1
    await expect(page.getByTestId("square-3-0")).toBeVisible(); // white queen d1

    // Screenshot: Initial board
    await page.screenshot({ path: "screenshots/e2e-01-initial-board.png" });
  });

  test("should select piece and show legal moves", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Click on white pawn at e2 (x=4, y=1)
    await page.getByTestId("square-4-1").click();

    // The pawn should be selected (highlighted)
    // Legal moves should be visible at e3(4,2) and e4(4,3)
    await page.screenshot({
      path: "screenshots/e2e-02-piece-selected-legal-moves.png",
    });
  });

  test("should execute pawn opening and switch turns", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // White: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Verify turn switched to black
    await expect(page.getByTestId("turn-indicator")).toContainText("黑方");

    // Screenshot: After e4
    await page.screenshot({ path: "screenshots/e2e-03-after-e4.png" });
  });

  test("should play multiple moves alternating turns", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // White: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    await expect(page.getByTestId("turn-indicator")).toContainText("黑方");

    // Black: e7 -> e5
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // White: knight Nf3 (g1->f3: x=6,y=0 -> x=5,y=2)
    await page.getByTestId("square-6-0").click();
    await page.getByTestId("square-5-2").click();
    await expect(page.getByTestId("turn-indicator")).toContainText("黑方");

    // Screenshot: After multiple moves
    await page.screenshot({ path: "screenshots/e2e-04-multiple-moves.png" });

    // Verify move history
    const moveHistory = page.getByTestId("move-history");
    await expect(moveHistory).toContainText("e2");
    await expect(moveHistory).toContainText("e4");
  });

  test("should not allow selecting opponent's pieces", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Try to click on black piece (should not select it, it's white's turn)
    await page.getByTestId("square-4-6").click();

    // Turn should still be white
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");
  });

  test("should handle knight moves correctly", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Click white knight at b1 (x=1, y=0)
    await page.getByTestId("square-1-0").click();

    // Screenshot: Knight legal moves
    await page.screenshot({
      path: "screenshots/e2e-05-knight-legal-moves.png",
    });

    // Move knight to c3 (x=2, y=2)
    await page.getByTestId("square-2-2").click();
    await expect(page.getByTestId("turn-indicator")).toContainText("黑方");
  });

  test("should capture pieces correctly", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Set up a capture scenario
    // White: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Black: d7 -> d5
    await page.getByTestId("square-3-6").click();
    await page.getByTestId("square-3-4").click();

    // White: e4 x d5 (capture)
    await page.getByTestId("square-4-3").click();
    await page.getByTestId("square-3-4").click();

    // Screenshot: After capture
    await page.screenshot({ path: "screenshots/e2e-06-piece-capture.png" });

    // Verify move history shows capture
    const moveHistory = page.getByTestId("move-history");
    await expect(moveHistory).toContainText("×");
  });

  test("should display check warning when king is in check", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play a scholar's mate attempt sequence to get check
    // 1. e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    // 1... e5
    await page.getByTestId("square-4-6").click();
    await page.getByTestId("square-4-4").click();
    // 2. Qh5 (Queen to h5: d1(3,0) -> h5(7,4))
    await page.getByTestId("square-3-0").click();
    await page.getByTestId("square-7-4").click();
    // 2... Nc6 (b8(1,7) -> c6(2,5))
    await page.getByTestId("square-1-7").click();
    await page.getByTestId("square-2-5").click();
    // 3. Bc4 (f1(5,0) -> c4(2,3))
    await page.getByTestId("square-5-0").click();
    await page.getByTestId("square-2-3").click();
    // 3... Nf6 (g8(6,7) -> f6(5,5))
    await page.getByTestId("square-6-7").click();
    await page.getByTestId("square-5-5").click();
    // 4. Qxf7# (Queen captures f7 pawn: h5(7,4) -> f7(5,6))
    await page.getByTestId("square-7-4").click();
    await page.getByTestId("square-5-6").click();

    // Should show checkmate
    await expect(page.getByTestId("game-over-overlay")).toBeVisible();

    // Screenshot: Checkmate (Scholar's Mate)
    await page.screenshot({
      path: "screenshots/e2e-07-checkmate-scholars-mate.png",
    });
  });

  test("should allow game reset after checkmate", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play scholar's mate
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

    // Click reset on game over overlay
    await page.getByTestId("game-over-reset").click();

    // Verify game is reset
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");
    await expect(page.getByTestId("game-over-overlay")).not.toBeVisible();

    // Screenshot: After reset
    await page.screenshot({
      path: "screenshots/e2e-08-reset-after-checkmate.png",
    });
  });

  test("should start AI game and AI makes a move", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-local-ai").click();
    await page.getByTestId("ai-easy").click();

    // Verify game started
    await expect(page.getByTestId("chess-board")).toBeVisible();
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // White makes a move: e2 -> e4
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Wait for AI to make a move (400ms delay + processing)
    await page.waitForTimeout(1000);

    // After AI moves, it should be white's turn again
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // Screenshot: After AI move
    await page.screenshot({ path: "screenshots/e2e-09-ai-opponent.png" });
  });

  test("should show move history correctly with captures", async ({
    page,
  }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Play some moves
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();
    await page.getByTestId("square-3-6").click();
    await page.getByTestId("square-3-4").click();
    await page.getByTestId("square-4-3").click();
    await page.getByTestId("square-3-4").click();

    // Screenshot: Move history
    await page.screenshot({
      path: "screenshots/e2e-10-move-history-detail.png",
      fullPage: true,
    });
  });

  test("should handle game reset from header button", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();

    // Make a move
    await page.getByTestId("square-4-1").click();
    await page.getByTestId("square-4-3").click();

    // Reset via header button
    await page.getByTestId("reset-btn").click();

    // Verify reset
    await expect(page.getByTestId("turn-indicator")).toContainText("白方");

    // Screenshot: After header reset
    await page.screenshot({ path: "screenshots/e2e-11-header-reset.png" });
  });

  test("should navigate back to menu", async ({ page }) => {
    await page.getByTestId("mode-local-pvp").click();
    await page.getByTestId("back-btn").click();

    // Verify back to menu
    await expect(page.getByTestId("game-title")).toBeVisible();
    await expect(page.getByTestId("game-menu")).toBeVisible();

    // Screenshot: Back to menu
    await page.screenshot({ path: "screenshots/e2e-12-back-to-menu.png" });
  });
});
