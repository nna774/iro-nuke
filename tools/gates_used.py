import json,sys,time
from collections import deque
V={'up':(-1,0),'down':(1,0),'left':(0,-1),'right':(0,1)}
def used_gates(L,cap=600000):
    S=L['size']; W=set(map(tuple,L['walls'])); G=L['gates']; P=L['pieces']; n=len(P)
    MAXICE=max([p['ice'] for p in P]+[0]); used=set()
    def col(i,peel): return P[i]['color'] if (P[i]['inner'] and not peel>>i&1) else (P[i]['inner'] or P[i]['color'])
    def cells(i,r,c): return [(r+a,c+b) for a,b in P[i]['shape']]
    def occ(pos,skip):
        o=set(W)
        for j,p in enumerate(pos):
            if p is not None and j!=skip: o.update(cells(j,*p))
        return o
    def gidx(side,lane,c): return [k for k,g in enumerate(G) if g['side']==side and g['color']==c and g['start']<=lane<g['start']+g['length']]
    def slide(pos,peel,i,d):
        vr,vc=V[d]; r0,c0=pos[i]; o=occ(pos,i); last=(r0,c0); k=0
        while True:
            k+=1; cl=cells(i,r0+vr*k,c0+vc*k); ins=[x for x in cl if 0<=x[0]<S and 0<=x[1]<S]
            if any(x in o for x in ins): return
            outs=[x for x in cl if x not in ins]
            if not outs: last=(r0+vr*k,c0+vc*k); yield ('move',last,None); continue
            side='top' if vr<0 else 'bottom' if vr>0 else 'left' if vc<0 else 'right'
            gs=[gidx(side, x[1] if vr else x[0], col(i,peel)) for x in outs]
            if not all(gs): return
            if len(outs)==len(cl):
                yield ('peel' if (P[i]['inner'] and not peel>>i&1) else 'exit', last, set(sum(gs,[]))); return
    start=(tuple((p['row'],p['col']) for p in P),0,0); seen={start}; q=deque([start])
    while q:
        pos,peel,ex=q.popleft()
        if len(seen)>cap: return None
        for i in range(n):
            if pos[i] is None or P[i]['ice']>ex: continue
            for d in P[i]['dirs']:
                for kind,np_,gs in slide(pos,peel,i,d):
                    npos=list(pos); npeel=peel; nex=ex
                    if kind=='exit': npos[i]=None; nex=min(MAXICE,ex+1); used|=gs
                    elif kind=='peel': npos[i]=np_; npeel=peel|(1<<i); used|=gs
                    else: npos[i]=np_
                    ns=(tuple(npos),npeel,nex)
                    if ns not in seen: seen.add(ns); q.append(ns)
    return used

if __name__=='__main__':
    # usage: python3 gates_used.py levels/levels.json 21 30 [--apply]   (1-based, inclusive)
    path=sys.argv[1]; a,b=int(sys.argv[2]),int(sys.argv[3]); apply='--apply' in sys.argv
    L=json.load(open(path)); t0=time.time()
    for i in range(a-1,b):
        u=used_gates(L[i])
        if u is None: print('stage',i+1,'search capped, skipped'); continue
        unused=[k for k in range(len(L[i]['gates'])) if k not in u]
        print('stage',i+1,'unused gates',[(L[i]['gates'][k]['side'],L[i]['gates'][k]['color'],L[i]['gates'][k]['length']) for k in unused],round(time.time()-t0),flush=True)
        if apply: L[i]['gates']=[g for k,g in enumerate(L[i]['gates']) if k not in unused]
    if apply: json.dump(L,open(path,'w'),separators=(',',':')); print('written',path)
