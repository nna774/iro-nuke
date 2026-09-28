// Dense packing + ice + layered blocks; exact search; start = farthest state from solved.
const fs=require('fs');
const [,, SEED0, SEED1, SIZE_ARG, OUT, TLIM] = process.argv;
const SIZE=+SIZE_ARG||7, N=SIZE*SIZE, TIME=(+TLIM||240)*1000;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const V={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};
const SIDE_DIR={top:'up',bottom:'down',left:'left',right:'right'};
function norm(s){const mr=Math.min(...s.map(x=>x[0])),mc=Math.min(...s.map(x=>x[1]));return s.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);}
function variants(s){const out=new Map();let cur=norm(s);for(let m=0;m<2;m++){for(let i=0;i<4;i++){out.set(JSON.stringify(cur),cur);cur=norm(cur.map(([r,c])=>[c,-r]));}cur=norm(cur.map(([r,c])=>[r,-c]));}return[...out.values()];}
const P5=[[[0,1],[1,0],[1,1],[1,2],[2,1]],[[0,0],[0,1],[0,2],[1,1],[2,1]],[[0,0],[1,0],[2,0],[3,0],[3,1]],[[0,0],[0,1],[1,0],[1,1],[2,0]],[[0,0],[0,2],[1,0],[1,1],[1,2]],[[0,0],[1,0],[2,0],[2,1],[2,2]],[[0,1],[1,0],[1,1],[2,1],[3,1]],[[0,0],[1,0],[1,1],[2,1],[3,1]],[[0,0],[0,1],[1,1],[2,1],[2,2]],[[0,1],[0,2],[1,0],[1,1],[2,1]]];
const P4=[[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,1],[0,2],[1,0],[1,1]],[[0,0],[0,1],[0,2],[0,3]]];
const P3=[[[0,0],[0,1],[0,2]],[[0,0],[1,0],[1,1]]];
const P2=[[[0,0],[0,1]]];const P1=[[[0,0]]];
const POOL=[];for(const[g,w]of[[P5,4],[P4,4],[P3,3],[P2,2],[P1,1]])for(const s of g)for(const v of variants(s))POOL.push([v,w]);
const COLS=['R','T','G','P','B','L'];

function build(rng){
  const pick=a=>a[Math.floor(rng()*a.length)];
  const wall=new Uint8Array(N);
  const nb=1+Math.floor(rng()*3);
  for(let b=0;b<nb;b++){const side=pick(['top','bottom','left','right']);const len=2+Math.floor(rng()*2);const st=Math.floor(rng()*(SIZE-len+1));const dep=rng()<0.3?2:1;
    for(let i=0;i<len;i++)for(let d=0;d<dep;d++){let r,c;const l=st+i;if(side==='top'){r=d;c=l}else if(side==='bottom'){r=SIZE-1-d;c=l}else if(side==='left'){r=l;c=d}else{r=l;c=SIZE-1-d}wall[r*SIZE+c]=1;}}
  if(rng()<0.5){const r=1+Math.floor(rng()*(SIZE-2)),c=1+Math.floor(rng()*(SIZE-2));wall[r*SIZE+c]=1;}
  const colors=COLS.slice(0,4+Math.floor(rng()*3));
  const used={top:[],bottom:[],left:[],right:[]};const gates=[];
  const edge=(side,l)=>side==='top'?l:side==='bottom'?(SIZE-1)*SIZE+l:side==='left'?l*SIZE:l*SIZE+SIZE-1;
  for(const col of colors){const n=rng()<0.4?2:1;const ws=n===2?[1,2,3].sort(()=>rng()-0.5).slice(0,2):[pick([1,2,2,3])];
    for(const w of ws){for(let t=0;t<80;t++){const side=pick(['top','bottom','left','right']);const st=Math.floor(rng()*(SIZE-w+1));
      let ok=true;for(let i=0;i<w;i++)if(wall[edge(side,st+i)])ok=false;
      for(const[s,e]of used[side])if(st<e+1&&s<st+w+1)ok=false;
      if(ok){used[side].push([st,st+w]);gates.push({side,start:st,length:w,color:col});break;}}}}
  const gateOK=(side,lane,col)=>gates.some(g=>g.side===side&&g.color===col&&lane>=g.start&&lane<g.start+g.length);
  function exitDirs(shape,col){const res=[];for(const side of['top','bottom','left','right']){const lanes=shape.map(([r,c])=>side==='top'||side==='bottom'?c:r);
      const maxOff=Math.max(...lanes);for(let base=0;base+maxOff<SIZE;base++){if(lanes.every(l=>gateOK(side,base+l,col))){res.push(SIDE_DIR[side]);break;}}}return res;}
  const occ=new Int16Array(N).fill(-1);const pieces=[];
  let total=0;for(let i=0;i<N;i++)if(!wall[i])total++;let filled=0;
  const target=0.62+rng()*0.2;let fails=0;
  while(filled/total<target&&fails<400){
    const col=pick(colors);let s=null;{let tw=POOL.reduce((a,x)=>a+x[1],0),x=rng()*tw;for(const[v,w]of POOL){x-=w;if(x<=0){s=v;break;}}if(!s)s=POOL[0][0];}
    const ex=exitDirs(s,col);if(!ex.length){fails++;continue;}
    // optional inner colour (layered): inner needs its own usable gate, and the outer too
    let inner=null,exAll=ex;
    if(rng()<0.22){const ic=pick(colors.filter(c=>c!==col));const ie=exitDirs(s,ic);if(ie.length){inner=ic;exAll=[...new Set([...ex,...ie])];}}
    const spots=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){let ok=true;for(const[dr,dc]of s){const rr=r+dr,cc=c+dc;if(rr>=SIZE||cc>=SIZE||wall[rr*SIZE+cc]||occ[rr*SIZE+cc]>=0){ok=false;break;}}if(ok)spots.push([r,c]);}
    if(!spots.length){fails++;continue;}
    const[r,c]=pick(spots);const id=pieces.length;
    let dirs=['up','down','left','right'];
    // two-way arrows only; both the outer and inner exits must stay reachable
    if(rng()<0.2){const d=pick(exAll);const axis=(d==='up'||d==='down')?['up','down']:['left','right'];
      if(ex.some(x=>axis.includes(x))&&(!inner||exitDirs(s,inner).some(x=>axis.includes(x))))dirs=axis;}
    pieces.push({shape:s,color:col,inner,row:r,col:c,dirs,ice:0});for(const[dr,dc]of s)occ[(r+dr)*SIZE+c+dc]=id;filled+=s.length;
  }
  // drop blocks that could leave immediately (they would just be free moves), then add ice
  for(let pass=0;pass<20;pass++){let removed=false;
    for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];if(p.inner)continue;
      const others=new Set();pieces.forEach((q,j)=>{if(j!==i)for(const[dr,dc]of q.shape)others.add((q.row+dr)*SIZE+q.col+dc);});
      let can=false;
      for(const d of p.dirs){const[vr,vc]=V[d];let good=true,side=null,lanes=new Set();
        for(let k=1;k<=SIZE+5&&good;k++){let allOut=true;
          for(const[dr,dc]of p.shape){const rr=p.row+dr+vr*k,cc=p.col+dc+vc*k;
            if(rr>=0&&rr<SIZE&&cc>=0&&cc<SIZE){allOut=false;if(wall[rr*SIZE+cc]||others.has(rr*SIZE+cc)){good=false;break;}}
            else{side=rr<0?'top':rr>=SIZE?'bottom':cc<0?'left':'right';lanes.add((side==='top'||side==='bottom')?cc:rr);}}
          if(allOut)break;}
        if(good&&side&&[...lanes].every(l=>gateOK(side,l,p.color))){can=true;break;}}
      if(can){pieces.splice(i,1);removed=true;}}
    if(!removed)break;}
  // ice on 1-2 non-layered pieces
  const cand=pieces.map((p,i)=>i).filter(i=>!pieces[i].inner);
  const nIce=Math.min(cand.length,1+Math.floor(rng()*2));
  for(let k=0;k<nIce;k++){const i=cand.splice(Math.floor(rng()*cand.length),1)[0];pieces[i].ice=1+Math.floor(rng()*Math.min(3,pieces.length-2));}
  return {wall,gates,pieces,gateOK};
}

function solve(B,CAP){
  const {wall,pieces,gateOK}=B;const P=pieces.length;
  const MAXICE=Math.max(0,...pieces.map(p=>p.ice));
  const cellsAt=[],exitInfo=[];
  for(const p of pieces){const ca=new Array(N).fill(null),ei=new Array(N).fill(null);
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){let ok=true;const cl=[];for(const[dr,dc]of p.shape){const rr=r+dr,cc=c+dc;if(rr>=SIZE||cc>=SIZE||wall[rr*SIZE+cc]){ok=false;break;}cl.push(rr*SIZE+cc);}
      if(!ok)continue;ca[r*SIZE+c]=cl;
      // per direction: in-board swept cells, the last fully-inside anchor, and which colours may pass
      const m={};
      for(const d of p.dirs){const[vr,vc]=V[d];const path=new Set();let good=true,lastIn=r*SIZE+c,side=null,lanes=new Set();
        for(let k=1;k<=SIZE+5;k++){let allOut=true,anyOut=false;
          for(const[dr,dc]of p.shape){const rr=r+dr+vr*k,cc=c+dc+vc*k;
            if(rr>=0&&rr<SIZE&&cc>=0&&cc<SIZE){allOut=false;if(wall[rr*SIZE+cc]){good=false;break;}path.add(rr*SIZE+cc);}
            else{anyOut=true;side=rr<0?'top':rr>=SIZE?'bottom':cc<0?'left':'right';lanes.add((side==='top'||side==='bottom')?cc:rr);}}
          if(!good)break;
          if(!anyOut)lastIn=(r+vr*k)*SIZE+(c+vc*k);
          if(allOut)break;}
        if(good&&side){const passes={};for(const col of COLS)passes[col]=[...lanes].every(l=>gateOK(side,l,col));m[d]={path:[...path],lastIn,passes};}}
      ei[r*SIZE+c]=m;}
    cellsAt.push(ca);exitInfo.push(m=>m);exitInfo[exitInfo.length-1]=ei;}
  const colorOf=(i,peel)=>(pieces[i].inner&&!(peel>>i&1))?pieces[i].color:(pieces[i].inner||pieces[i].color);
  const layeredNow=(i,peel)=>pieces[i].inner&&!(peel>>i&1);
  const occOf=pos=>{const o=new Int16Array(N).fill(-1);for(let i=0;i<P;i++)if(pos[i]>=0)for(const x of cellsAt[i][pos[i]])o[x]=i;return o;};
  // greedy full exits of plain, unfrozen blocks (never harmful)
  function normalize(pos,peel,ex){const o=occOf(pos);let ch=true;while(ch){ch=false;for(let i=0;i<P;i++){if(pos[i]<0||layeredNow(i,peel)||pieces[i].ice>ex)continue;const m=exitInfo[i][pos[i]];const col=colorOf(i,peel);
        for(const d in m){if(m[d].passes[col]&&m[d].path.every(x=>o[x]<0||o[x]===i)){for(const x of cellsAt[i][pos[i]])o[x]=-1;pos[i]=-1;ex=Math.min(MAXICE,ex+1);ch=true;break;}}}}return ex;}
  const K=(pos,peel,ex)=>pos.join(',')+'|'+peel+'|'+ex;
  const p0=pieces.map(p=>p.row*SIZE+p.col);const e0=normalize(p0,0,0);
  const ids=new Map(),S=[],adj=[];ids.set(K(p0,0,e0),0);S.push([p0,0,e0]);
  for(let h=0;h<S.length;h++){if(S.length>CAP)return null;
    const[pos,peel,ex]=S[h];const o=occOf(pos);const out=[];
    const add=(np,npeel,nex)=>{nex=normalize(np,npeel,nex);const k=K(np,npeel,nex);let id=ids.get(k);if(id===undefined){id=S.length;ids.set(k,id);S.push([np,npeel,nex]);}out.push(id);};
    for(let i=0;i<P;i++){if(pos[i]<0||pieces[i].ice>ex)continue;const r0=Math.floor(pos[i]/SIZE),c0=pos[i]%SIZE;
      for(const d of pieces[i].dirs){const[vr,vc]=V[d];
        for(let k=1;;k++){const r=r0+vr*k,c=c0+vc*k;if(r<0||c<0||r>=SIZE||c>=SIZE)break;const cl=cellsAt[i][r*SIZE+c];if(!cl)break;
          if(!cl.every(x=>o[x]<0||o[x]===i))break;const np=pos.slice();np[i]=r*SIZE+c;add(np,peel,ex);}
        // peel: layered block pushed through a gate of its outer colour stays at the gate edge with the inner colour
        if(layeredNow(i,peel)){const e=exitInfo[i][pos[i]][d];
          if(e&&e.passes[pieces[i].color]&&e.path.every(x=>o[x]<0||o[x]===i)){const np=pos.slice();np[i]=e.lastIn;add(np,peel|(1<<i),ex);}}}}
    adj.push(out);}
  let goal=-1;for(let i=0;i<S.length;i++)if(S[i][0].every(x=>x<0)){goal=i;break;}
  if(goal<0)return {solvable:false,n:S.length};
  const radj=S.map(()=>[]);adj.forEach((o,i)=>o.forEach(j=>radj[j].push(i)));
  const dist=new Int32Array(S.length).fill(-1);dist[goal]=0;const q=[goal];
  for(let h=0;h<q.length;h++)for(const j of radj[q[h]])if(dist[j]<0){dist[j]=dist[q[h]]+1;q.push(j);}
  const presentKey=pos=>pos.map(x=>x>=0?1:0).join('');const pk=presentKey(p0);
  let best=0;for(let i=0;i<S.length;i++){const[pos,peel,ex]=S[i];if(peel===0&&ex===e0&&presentKey(pos)===pk&&dist[i]>dist[best])best=i;}
  return {solvable:true,n:S.length,dist:dist[best],pos:S[best][0],ex:e0};
}

const results=[];const t0=Date.now();let tried=0;
for(let seed=+SEED0;seed<+SEED1;seed++){
  if(Date.now()-t0>TIME)break;tried++;
  const rng=mulberry(seed*7919+101);const B=build(rng);if(B.pieces.length<6)continue;
  const R=solve(B,120000);if(!R||!R.solvable||R.dist<0)continue;
  const keep=B.pieces.map((p,i)=>({...p,row:Math.floor(R.pos[i]/SIZE),col:R.pos[i]%SIZE,alive:R.pos[i]>=0})).filter(p=>p.alive)
    .map(p=>({shape:p.shape,color:p.color,inner:p.inner,row:p.row,col:p.col,dirs:p.dirs,ice:Math.max(0,p.ice-R.ex)}));
  const used=new Set();keep.forEach(p=>{used.add(p.color);if(p.inner)used.add(p.inner);});
  const walls=[];for(let i=0;i<N;i++)if(B.wall[i])walls.push([Math.floor(i/SIZE),i%SIZE]);
  const nIce=keep.filter(p=>p.ice>0).length,nLay=keep.filter(p=>p.inner).length;
  results.push({seed,size:SIZE,dist:R.dist,states:R.n,nIce,nLay,pieces:keep,gates:B.gates.filter(g=>used.has(g.color)),walls});
}
results.sort((a,b)=>b.dist-a.dist);
fs.writeFileSync(OUT,JSON.stringify(results));
console.log('tried',tried,'solvable',results.length,'secs',(Date.now()-t0)/1000);
console.log(results.slice(0,10).map(r=>`seed ${r.seed} dist ${r.dist} pieces ${r.pieces.length} ice ${r.nIce} layered ${r.nLay} states ${r.states}`).join('\n'));
