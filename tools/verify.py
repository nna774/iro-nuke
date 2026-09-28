import json,sys,time
from collections import deque
V={'up':(-1,0),'down':(1,0),'left':(0,-1),'right':(0,1)}
def check(L,cap=400000):
    S=L['size']; W=set(map(tuple,L['walls'])); G=L['gates']; P=L['pieces']; n=len(P)
    MAXICE=max([p['ice'] for p in P]+[0])
    def gate(side,lane,col): return any(g['side']==side and g['color']==col and g['start']<=lane<g['start']+g['length'] for g in G)
    def col(i,peel): return P[i]['color'] if (P[i]['inner'] and not peel>>i&1) else (P[i]['inner'] or P[i]['color'])
    def cells(i,r,c): return [(r+a,c+b) for a,b in P[i]['shape']]
    def occ(pos,skip):
        o=set(W)
        for j,p in enumerate(pos):
            if p is not None and j!=skip: o.update(cells(j,*p))
        return o
    def slide(pos,peel,i,d):
        """yield (kind,newpos) for every stopping point of piece i in direction d"""
        vr,vc=V[d]; r0,c0=pos[i]; o=occ(pos,i); last=(r0,c0); k=0
        while True:
            k+=1; cl=cells(i,r0+vr*k,c0+vc*k); ins=[x for x in cl if 0<=x[0]<S and 0<=x[1]<S]
            if any(x in o for x in ins): return
            outs=[x for x in cl if x not in ins]
            if not outs: last=(r0+vr*k,c0+vc*k); yield ('move',last); continue
            side='top' if vr<0 else 'bottom' if vr>0 else 'left' if vc<0 else 'right'
            if not all(gate(side, x[1] if vr else x[0], col(i,peel)) for x in outs): return
            if len(outs)==len(cl):
                yield ('peel' if (P[i]['inner'] and not peel>>i&1) else 'exit', last); return
    def norm(pos,peel,ex):
        pos=list(pos)
        while True:
            hit=False
            for i in range(n):
                if pos[i] is None or P[i]['ice']>ex or (P[i]['inner'] and not peel>>i&1): continue
                for d in P[i]['dirs']:
                    if any(k=='exit' for k,_ in slide(pos,peel,i,d)):
                        pos[i]=None; ex=min(MAXICE,ex+1); hit=True; break
            if not hit: return tuple(pos),ex
    p0,e0=norm(tuple((p['row'],p['col']) for p in P),0,0)
    start=(p0,0,e0); dist={start:0}; q=deque([start])
    while q:
        st=q.popleft(); pos,peel,ex=st; d0=dist[st]
        if len(dist)>cap: return None
        for i in range(n):
            if pos[i] is None or P[i]['ice']>ex: continue
            for d in P[i]['dirs']:
                for kind,np_ in slide(pos,peel,i,d):
                    npos=list(pos); npeel=peel; nex=ex
                    if kind=='exit': npos[i]=None; nex=min(MAXICE,ex+1)
                    else: npos[i]=np_
                    if kind=='peel': npeel=peel|(1<<i)
                    npos,nex=norm(tuple(npos),npeel,nex)
                    ns=(npos,npeel,nex)
                    if all(x is None for x in npos): return d0+1
                    if ns not in dist: dist[ns]=d0+1; q.append(ns)
    return -1

if __name__=='__main__':
    # usage: python3 verify.py levels/levels.json 21 22 ...   (1-based stage numbers)
    #    or: python3 verify.py candidates.json --seeds 61906 60545   (generator output)
    src=json.load(open(sys.argv[1])); args=sys.argv[2:]
    if args and args[0]=='--seeds':
        by={r['seed']:r for r in src}; items=[(s,by[int(s)]) for s in args[1:]]
    else:
        items=[(a,src[int(a)-1]) for a in args] or [(i+1,l) for i,l in enumerate(src)]
    t0=time.time()
    for name,L in items:
        print(name,'min moves',check(L),'(generator said %s)'%L.get('dist','-'),round(time.time()-t0),flush=True)
