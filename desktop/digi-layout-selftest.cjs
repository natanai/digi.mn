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
const actorColorX = (r,g,b) => `(() => {
  const canvas=document.querySelector(".digi-street-frame canvas");
  if(!canvas) return null;
  const ctx=canvas.getContext("2d");
  if(!ctx) return null;
  const image=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let xSum=0,count=0;
  for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;
    if(image[i]===${r} && image[i+1]===${g} && image[i+2]===${b} && image[i+3]===255){
      xSum+=x;
      count++;
    }
  }
  return count ? xSum/count : null;
})()`;
// These distinctive atlas palette colors cannot be produced by scenery or the
// old geometric placeholders. Checks therefore verify real imported art.
const spriteX=actorColorX(211,150,109);
const companionX=actorColorX(245,87,107);

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
    wc.on("console-message", (_event, level, message) => {
      if (level >= 2) console.error("[digi.mn Chromium]", message);
    });
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
    assert.ok(desktop.history.top <= desktop.stage.top + 2
      && desktop.history.bottom >= desktop.action.bottom - 2,
      "History must occupy the full left reading column");
    assert.ok(desktop.history.right <= desktop.action.left + 2
      && desktop.history.right <= desktop.stage.left + 2,
      "The stage and terminal must share the right column without overlapping history");
    assert.ok(desktop.stage.bottom <= desktop.action.top + 2,
      "The stage must sit above the interactive terminal");
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

    // Clicking a suggestion must EXECUTE the command directly (not leave it
    // in the text field for a second Enter press).
    const beforeLines=await wc.executeJavaScript(
      'document.querySelectorAll(".terminal-history .command-line").length');
    const chosen=await wc.executeJavaScript(`(() => {
      const options=[...document.querySelectorAll(".terminal-command-choice")];
      const labels=options.map(button=>button.textContent?.trim() ?? "");
      const bounty=options.find(button=>button.textContent?.trim()==="accept the bounty");
      if (!bounty) return { clicked:false,labels };
      try { bounty.click(); return {clicked:true,labels}; }
      catch (error) { return {clicked:false,labels,error:String(error)}; }
    })()`);
    assert.ok(chosen.clicked, "The demo must offer an executable bounty choice: "+JSON.stringify(chosen));
    await until(wc,
      'document.querySelectorAll(".terminal-history .command-line").length > '+beforeLines,
      "one-click command submission, not insertion into a draft");
    // The stock bounty emits a real authored cutaway cue. Verify the Media
    // viewer receives an actual image rather than an empty overlay.
    await until(wc, 'Boolean(document.querySelector(".media-asset-viewer img"))', "authored bounty cutaway", 8000);
    await wc.executeJavaScript('document.querySelector(".media-asset-viewer-toolbar button:last-child")?.click()');
    await until(wc, '!document.querySelector(".media-asset-viewer")', "close cinematic viewer");
    await wc.executeJavaScript(`document.querySelector(".terminal-history")?.dispatchEvent(
      new PointerEvent("pointerdown",{bubbles:true,cancelable:true})
    )`);

    // A real pointer event, projected through the canvas rect, must move the
    // rendered sprite. Keyboard steering is deliberately NOT part of digi.mn.
    const firstX = await until(wc, spriteX, "real Cleaner atlas pixels");
    const firstCompanionX = await until(wc, companionX, "real Digimon atlas pixels");
    assert.ok(firstCompanionX < firstX,
      "The red-maned companion must visibly follow behind the Cleaner");
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

    return { desktop: "full-height-log-left", narrow: "stacked", suggestions: "one-click-contained", movement: "point-and-click" };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}
module.exports = { verifyDigiLayout };
