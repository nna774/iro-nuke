// usage: node climb_experimental.js <seedsJSONfiles,comma> <seed> <secs> <out> [rngseed]
const fs=require('fs');
const [,, FILES, SEED, SECS, OUT, RS] = process.argv;
const {createEngine,mulberry,POOL}=require(require('path').join(__dirname,'generate_lib.js'));
const SIZE=7,N=49;
const {solve}=createEngine(SIZE);
let base=null;for(const f of FILES.split(',')){const d=JSON.parse(fs.readFileSync(f));for(const r of (Array.isArray(d)?d:[d]))if(r.seed==+SEED)base=r;}
const rng=mulberry(+RS||+SEED);const pick=a=>a[Math.floor(rng()*a.length)];
function mkB(lv){const wall=new Uint8Array(N);lv.walls.forEach(([r,c])=>wall[r*SIZE+c]=1);
  const gates=lv.gates;const gateOK=(side,lane,col)=>gates.some(g=>g.side===side&&g.color===col&&lane>=g.start&&lane<g.start+g.length);
  return {wall,gates,pieces:lv.pieces.map(p=>({...p,inner:p.inner||null,ice:p.ice||0})),gateOK};}
function evalLv(lv){const B=mkB(lv);const R=solve(B,60000);if(!R||!R.solvable||R.dist<=0)return null;
  const pieces=B.pieces.map((p,i)=>({...p,row:Math.floor(R.pos[i]/SIZE),col:R.pos[i]%SIZE,alive:R.pos[i]>=0})).filter(p=>p.alive)
    .map(p=>({shape:p.shape,color:p.color,inner:p.inner,row:p.row,col:p.col,dirs:p.dirs,ice:Math.max(0,p.ice-R.ex)}));
  if(pieces.length<5)return null;
  return {dist:R.dist,states:R.n,lv:{size:SIZE,walls:lv.walls,gates:lv.gates,pieces}};}
const clone=o=>JSON.parse(JSON.stringify(o));
function occ(lv,skip){const o=new Set(lv.walls.map(([r,c])=>r*SIZE+c));lv.pieces.forEach((p,i)=>{if(i!==skip)p.shape.forEach(([a,b])=>o.add((p.row+a)*SIZE+p.col+b));});return o;}
function mutate(lv){const m=clone(lv);const t=rng();const colors=[...new Set(m.gates.map(g=>g.color))];
  if(t<0.22){ // move/resize a gate
    const g=pick(m.gates);const sides=['top','bottom','left','right'];if(rng()<0.3)g.side=pick(sides);
    g.length=Math.max(1,Math.min(3,g.length+pick([-1,0,1])));g.start=Math.max(0,Math.min(SIZE-g.length,g.start+pick([-1,0,1,-2,2])));
  }else if(t<0.4){ // remove a piece
    if(m.pieces.length>5)m.pieces.splice(Math.floor(rng()*m.pieces.length),1);
  }else if(t<0.65){ // add a piece in free space
    const o=occ(m,-1);const s=pick(POOL)[0];const spots=[];
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(s.every(([a,b])=>r+a<SIZE&&c+b<SIZE&&!o.has((r+a)*SIZE+c+b)))spots.push([r,c]);
    if(spots.length){const[r,c]=pick(spots);m.pieces.push({shape:s,color:pick(colors),inner:null,row:r,col:c,dirs:['up','down','left','right'],ice:0});}
  }else if(t<0.75){ // change arrows
    const p=pick(m.pieces);p.dirs=p.dirs.length===4?pick([['up','down'],['left','right']]):['up','down','left','right'];
  }else if(t<0.85){ // toggle / retune ice
    const p=pick(m.pieces);if(!p.inner)p.ice=p.ice?(rng()<0.5?0:Math.max(1,Math.min(4,p.ice+pick([-1,1])))):1+Math.floor(rng()*3);
  }else if(t<0.93){ // toggle a layer
    const p=pick(m.pieces);if(p.inner)p.inner=null;else if(!p.ice){const ic=pick(colors.filter(c=>c!==p.color));if(ic)p.inner=ic;}
  }else{ // recolour a piece
    const p=pick(m.pieces);p.color=pick(colors);if(p.inner===p.color)p.inner=null;}
  // keep at most 2 ice and 2 layered
  let ni=0,nl=0;m.pieces.forEach(p=>{if(p.ice){ni++;if(ni>2)p.ice=0;}if(p.inner){nl++;if(nl>2)p.inner=null;}});
  // gates on one side must not overlap
  for(const a of m.gates)for(const b of m.gates)if(a!==b&&a.side===b.side&&a.start<b.start+b.length+1&&b.start<a.start+a.length+1)return null;
  // gate cells must not be walls
  const edge=(side,l)=>side==='top'?[0,l]:side==='bottom'?[SIZE-1,l]:side==='left'?[l,0]:[l,SIZE-1];
  for(const g of m.gates)for(let i=0;i<g.length;i++){const[r,c]=edge(g.side,g.start+i);if(m.walls.some(w=>w[0]===r&&w[1]===c))return null;}
  return m;}
let cur=evalLv({size:SIZE,walls:base.walls,gates:base.gates,pieces:base.pieces});
let best=cur;const t0=Date.now();let it=0;
while(Date.now()-t0<(+SECS)*1000){it++;
  const m=mutate(cur.lv);if(!m)continue;const r=evalLv(m);if(!r)continue;
  const ice=r.lv.pieces.some(p=>p.ice>0);
  if(r.dist>=cur.dist||rng()<0.03){cur=r;if(r.dist>best.dist&&ice)best=r;}}
console.log('seed',SEED,'start',evalLv({size:SIZE,walls:base.walls,gates:base.gates,pieces:base.pieces}).dist,'best',best.dist,'iters',it,'pieces',best.lv.pieces.length,'ice',best.lv.pieces.filter(p=>p.ice).length,'layer',best.lv.pieces.filter(p=>p.inner).length);
fs.writeFileSync(OUT,JSON.stringify({seed:+SEED,dist:best.dist,...best.lv}));
