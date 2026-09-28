const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','game','index.html'),'utf8');
const dom=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.Element.prototype.getBoundingClientRect=function(){return {width:280,height:280,left:0,top:0};};
  w.Element.prototype.setPointerCapture=function(){};

}});
const w=dom.window,d=w.document;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
const btns=()=>[...d.querySelectorAll('.lv-btn')];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function ev(type,el,x,y){const e=new w.MouseEvent(type,{bubbles:true,clientX:x,clientY:y});el.dispatchEvent(e);}
(async()=>{
  for(let i=0;i<btns().length;i++){btns()[i].click();await sleep(5);
    const cells=d.querySelectorAll('.cell').length; if(!cells) console.log('level',i+1,'no cells!');}
  console.log('levels rendered:',btns().length,'errors:',errs.length);
  // Level 1: one red domino at (2,0) of a 7x7, gate right row 2 -> drag right far => exit
  btns()[0].click();await sleep(5);
  const board=d.getElementById('board');const CELL=280/7;
  let cell=d.querySelector('.cell');
  ev('pointerdown',cell,10,10);ev('pointermove',board,10+CELL*3,10);ev('pointermove',board,10+CELL*7,10);ev('pointerup',board,10+CELL*7,10);
  await sleep(400);
  console.log('L1 after drag: cells',d.querySelectorAll('.cell').length,'win shown',d.getElementById('winOverlay').classList.contains('show'),'moves',d.getElementById('moveLabel').textContent);
  d.getElementById('undoBtn').click();await sleep(5);
  console.log('after undo cells',d.querySelectorAll('.cell').length);
  // corner turn test on level 2: T piece vertical at (0,2); move down 1 then right 1 in one drag
  btns()[1].click();await sleep(5);
  cell=d.querySelector('.cell[data-pid="0"]');const before=cell.style.transform;
  ev('pointerdown',cell,0,0);ev('pointermove',board,0,CELL*0.5);ev('pointermove',board,0,CELL*1.0);ev('pointermove',board,CELL*0.6,CELL*1.0);ev('pointermove',board,CELL*1.0,CELL*1.0);ev('pointerup',board,CELL*1.0,CELL*1.0);
  await sleep(300);
  cell=d.querySelector('.cell[data-pid="0"]');
  console.log('turn test transform before',before,'after',cell.style.transform,'moves',d.getElementById('moveLabel').textContent);
  // reset then undo restores
  d.getElementById('resetBtn').click();await sleep(5);
  console.log('after reset moves',d.getElementById('moveLabel').textContent,'undo enabled',!d.getElementById('undoBtn').disabled);
  d.getElementById('undoBtn').click();await sleep(5);
  console.log('after undo-of-reset moves',d.getElementById('moveLabel').textContent,'transform',d.querySelector('.cell[data-pid="0"]').style.transform);
  // levels with ice/layer show tags
  btns()[10].click();await sleep(5);
  console.log('L11 ice tags',d.querySelectorAll('.tag.ice').length,'layered inners',d.querySelectorAll('.cell .inner').length,'frozen cells',d.querySelectorAll('.cell.frozen').length);
  console.log('errors',errs);
  process.exit(0);
})();
