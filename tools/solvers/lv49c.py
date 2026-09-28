import heapq,sys
exec(open('lv49b.py').read().split("import sys")[0])
def bestfirst(goal_ex, W=8, cap=1_500_000):
    pos0=tuple(p[4] for p in P); peel0=tuple(0 for _ in P)
    pos0,peel0,ex0,pre=normalize(pos0,peel0)
    start=(pos0,peel0,ex0,0)
    g={start:0}; par={start:None}; cnt=0
    h=[(0-W*ex0,0,cnt,start)]
    while h:
        f,d,_,st=heapq.heappop(h); pos,peel,ex,pe=st
        if d>g[st]: continue
        if ex>=goal_ex:
            path=[];s=st
            while par[s]: s,ms=par[s]; path=ms+path
            return pre+path,len(g)
        if len(g)>cap: return None,len(g)
        for m in moves_from(pos,peel):
            np_,npl,e1,p1=apply(pos,peel,m)
            np_,npl,e2,extra=normalize(np_,npl)
            ns=(np_,npl,ex+e1+e2,pe+p1); nd=d+1
            if nd<g.get(ns,1e9):
                g[ns]=nd; par[ns]=(st,[m]+extra); cnt+=1
                heapq.heappush(h,(nd-W*ns[2]-2*ns[3],nd,cnt,ns))
    return None,len(g)
goal=int(sys.argv[1]); W=float(sys.argv[2])
path,n=bestfirst(goal,W)
print('states',n)
if path:
    print(len(path),'steps')
    for i,dn,k,kind,_ in path: print(' ',P[i][0],dn,k,{'move':'','peel':'→ 外側がはがれる','exit':'→ 脱出'}[kind])
