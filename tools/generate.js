// usage: node generate.js <seed0> <seed1> <size> <out> [secs]
const fs=require('fs');
const {createEngine,mulberry}=require('./generate_lib.js');
const [,, SEED0, SEED1, SIZE_ARG, OUT, TLIM] = process.argv;
const SIZE=+SIZE_ARG||7, N=SIZE*SIZE, TIME=(+TLIM||240)*1000;
const {build,solve}=createEngine(SIZE);

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
