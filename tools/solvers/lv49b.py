exec(open('lv49.py').read().split("if __name__")[0])
def moves_from(pos,peel):
    occ=set(WALL)|ICE; own={}
    for i,p in enumerate(pos):
        if p is None: continue
        for dr,dc in P[i][3]: own[(p[0]+dr,p[1]+dc)]=i
    for i,p in enumerate(pos):
        if p is None: continue
        col=P[i][2] if peel[i] else P[i][1]; layered=P[i][2] is not None and not peel[i]
        for dn,(vr,vc) in V.items():
            k=0; li=0
            while True:
                k+=1; ok=True; out=0
                for dr,dc in P[i][3]:
                    r,c=p[0]+dr+vr*k,p[1]+dc+vc*k
                    if inb(r,c):
                        if (r,c) in occ or own.get((r,c),i)!=i: ok=False;break
                    else:
                        rr,cc=r,c
                        while not inb(rr-vr,cc-vc): rr,cc=rr-vr,cc-vc
                        if GATE.get((rr,cc))!=col: ok=False;break
                        out+=1
                if not ok: break
                n=len(P[i][3])
                if out==0: li=k; yield (i,dn,k,'move',(p[0]+vr*k,p[1]+vc*k))
                elif out==n:
                    if layered: yield (i,dn,k,'peel',(p[0]+vr*li,p[1]+vc*li))
                    else: yield (i,dn,k,'exit',None)
                    break
def apply(pos,peel,m):
    i,dn,k,kind,np_=m; pos=list(pos); peel=list(peel); pos[i]=np_
    if kind=='peel': peel[i]=1
    return tuple(pos),tuple(peel),(1 if kind=='exit' else 0),(1 if kind=='peel' else 0)
def normalize(pos,peel):
    """free exits of plain blocks never hurt: take them all"""
    extra=[]; ex=0
    while True:
        found=None
        for m in moves_from(pos,peel):
            if m[3]=='exit': found=m;break
        if not found: return pos,peel,ex,extra
        pos,peel,_,_=apply(pos,peel,found); ex+=1; extra.append(found)
def search(goal_ex, goal_events=None, cap=2_500_000):
    pos0=tuple(p[4] for p in P); peel0=tuple(0 for _ in P)
    pos0,peel0,ex0,pre=normalize(pos0,peel0)
    start=(pos0,peel0,ex0,0)
    seen={start:None}; q=deque([start])
    while q:
        st=q.popleft(); pos,peel,ex,pe=st
        done = ex>=goal_ex if goal_events is None else ex+pe>=goal_events
        if done:
            path=[];s=st
            while seen[s]: s,ms=seen[s]; path=ms+path
            return pre+path,len(seen)
        if len(seen)>cap: return None,len(seen)
        for m in moves_from(pos,peel):
            np_,npl,e1,p1=apply(pos,peel,m)
            np_,npl,e2,extra=normalize(np_,npl)
            ns=(np_,npl,ex+e1+e2,pe+p1)
            if ns not in seen: seen[ns]=(st,[m]+extra); q.append(ns)
    return None,len(seen)
import sys
mode=sys.argv[1]; n=int(sys.argv[2])
path,cnt=search(n) if mode=='exit' else search(99,n)
print('states',cnt)
if path:
    print(len(path),'steps')
    for i,dn,k,kind,_ in path: print(' ',P[i][0],dn,k,{'move':'','peel':'→ 外側がはがれる','exit':'→ 脱出'}[kind])
