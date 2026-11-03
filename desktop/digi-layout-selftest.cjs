"use strict";
const assert = require("node:assert/strict");
const { BrowserWindow } = require("electron");

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(webContents, expression, name, timeout = 20000) {
  const begun = Date.now();
  while (Date.now() - begun < timeout) {
    const satisfied = await webContents.executeJavaScript(expression).catch(() => false);
    if (satisfied) return satisfied;
    await pause(120);
  }
  throw new Error("digi.mn graphical layout self-test timed out waiting for " + name);
}
const describeLayout = `(() => {
  const rect = (selector) => {
    const e = document.querySelector(selector);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { left:b.left, right:b.right, top:b.top, bottom:b.bottom,
      width:b.width, height:b.height, display:getComputedStyle(e).display };
  };
  return {
    shell:rect(".digi-shell"),
    stage:rect(".digi-stage-slot"),
    history:rect(".digi-narration-panel"),
    action:rect(".digi-actions-panel"),
    choices:rect(".terminal-command-choices"),
    view:rect(".digi-view-toggle"),
    settings:rect(".author-settings"),
    menu:rect(".terminal-command-toggle"),
    historyScroll: getComputedStyle(document.querySelector(".terminal-history")).overflowY,
    menuPosition: document.querySelector(".terminal-command-choices")
      ? getComputedStyle(document.querySelector(".terminal-command-choices")).position : null,
  };
})()`;
const noOverlap = (a,b) => a && b &&
  (a.right <= b.left + 1 || b.right <= a.left + 1 ||
   a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
const spriteX = `(() => {
  const canvas=document.querySelector(".digi-street-frame canvas");
  if(!canvas) return null;
  const ctx=canvas.getContext("2d");
  if(!ctx) return null;
  const image=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let xSum=0, count=0;
  // Placeholder Cleaner sprite head uses #cfa388; the scene does not.
  for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;
    if(image[i]===207 && image[i+1]===163 && image[i+2]===136 && image[i+3]===255){
      xSum+=x;
      count++;
    }
  }
  return count ? xSum/count : null;
})()`;

async function verifyDigiLayout(url, preload) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: "#10151b",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      preload,
    },
  });
  try {
    await win.loadURL(url);
    const wc = win.webContents;
    await until(wc, 'Boolean(document.querySelector(".universe-bootstrap-action"))', "start button");
    await wc.executeJavaScript('document.querySelector(".universe-bootstrap-action").click()');
    await until(wc, 'Boolean(document.querySelector(".digi-shell .terminal-history") && document.querySelector(".digi-stage-slot"))', "playable game shell");
    // Initial narration uses timed text. Its suggestions deliberately remain
    // unavailable until that text finishes, so finish it before measuring the
    // real interactive state, rather than asserting against a nonexistent menu.
    await wc.executeJavaScript(`document.querySelector(".terminal-history")?.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true })
    )`);
    await until(wc, 'Boolean(document.querySelector(".terminal-command-choices"))', "available command choices", 20000);
    let desktop = await wc.executeJavaScript(describeLayout);
    assert.ok(desktop.stage && desktop.history && desktop.action && desktop.view && desktop.settings,
      "Stage, narration, actions, and app controls must all exist");
    assert.ok(desktop.stage.width > 200 && desktop.stage.width <= 823,
      "Stage must be centered and capped rather than stretched across the desktop");
    assert.ok(desktop.stage.bottom <= desktop.history.top + 2 && desktop.stage.bottom <= desktop.action.top + 2,
      "Stage must sit above lower panels");
    assert.ok(noOverlap(desktop.history, desktop.action),
      "Narration and terminal must have physically separate panels");
    assert.ok(noOverlap(desktop.view, desktop.settings),
      "View and global settings buttons must not overlap");
    assert.equal(desktop.historyScroll, "auto", "History must scroll independently");
    assert.equal(desktop.menuPosition, "relative",
      "Suggestions must be in normal panel flow, never an absolute overlay");
    if (desktop.choices) {
      assert.ok(desktop.choices.left >= desktop.action.left - 1 && desktop.choices.right <= desktop.action.right + 1,
        "Suggestions must stay inside the terminal panel");
    }
    if (desktop.menu) {
      await wc.executeJavaScript('document.querySelector(".terminal-command-toggle").click()');
      await pause(140);
      desktop = await wc.executeJavaScript(describeLayout);
      assert.equal(desktop.menuPosition, "relative", "Expanded suggestions cannot float over narration");
      assert.ok(!desktop.choices || noOverlap(desktop.choices,desktop.history),
        "Expanded suggestions must not cover the story log");
    }

    // A real pointer event, projected through the canvas rect, must move the
    // rendered sprite. Keyboard steering is deliberately NOT part of digi.mn.
    const firstX = await until(wc, spriteX, "drawn player sprite");
    await wc.executeJavaScript(`(() => {
      const canvas = document.querySelector(".digi-street-frame canvas");
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", button: 0,
        clientX: rect.left + rect.width * (190/256),
        clientY: rect.top + rect.height * (116/144),
      }));
    })()`);
    const walkedX = await until(wc, `${spriteX} > ${firstX + 5} && ${spriteX}`, "actual click-to-walk movement");
    assert.ok(walkedX > firstX + 5, "Player must walk to the clicked world location");
    // Clicking a new destination cancels/replaces the previous walk.
    await wc.executeJavaScript(`(() => {
      const canvas=document.querySelector(".digi-street-frame canvas");
      const rect=canvas.getBoundingClientRect();
      const x=${walkedX};
      canvas.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles:true,cancelable:true,pointerId:2,pointerType:"mouse",button:0,
        clientX:rect.left+rect.width*(x/256),
        clientY:rect.top+rect.height*(114/144),
      }));
    })()`);
    await pause(300);
    const stoppedX = await wc.executeJavaScript(spriteX);
    await wc.executeJavaScript('window.dispatchEvent(new KeyboardEvent("keydown",{key:"d",bubbles:true}))');
    await pause(240);
    const afterKeyboard = await wc.executeJavaScript(spriteX);
    assert.ok(stoppedX !== null && afterKeyboard !== null && Math.abs(stoppedX - afterKeyboard) < 1,
      "Arrow/WASD keys must never steer the player, even if the scene has focus");
    await wc.executeJavaScript('window.dispatchEvent(new KeyboardEvent("keyup",{key:"d",bubbles:true}))');

    // The narrower layout is stacked rather than compressing input beneath text.
    win.setSize(850, 740);
    await pause(200);
    const narrow = await wc.executeJavaScript(describeLayout);
    assert.ok(narrow.history && narrow.action && narrow.stage);
    assert.ok(narrow.stage.bottom <= narrow.history.top + 2, "Stage must remain above the story on a narrow window");
    assert.ok(narrow.history.bottom <= narrow.action.top + 2, "Narrow history and actions must stack");
    assert.ok(narrow.action.width > 200, "Narrow terminal must remain usable");

    return { desktop: "side-by-side", narrow: "stacked", suggestions: "contained", movement: "point-and-click" };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}
module.exports = { verifyDigiLayout };
