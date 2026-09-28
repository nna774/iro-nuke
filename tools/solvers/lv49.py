from collections import deque
R,C=10,8
WALL={(2,c) for c in range(6)}|{(3,5),(4,5),(5,5),(6,5),(5,2),(6,2)}|{(7,c) for c in range(2,6)}
GATE={}
for c in (1,2,3): GATE[(-1,c)]='red'
for c in (6,7): GATE[(-1,c)]='yellow'
for r in (0,1): GATE[(r,-1)]='orange'
for r in (0,1): GATE[(r,C)]='blue'
for r in (4,5,6): GATE[(r,C)]='cyan'
GATE[(9,C)]='pink'
H=[(0,0),(0,1)]; Vt=[(0,0),(1,0)]
# name, outer, inner(None), shape, anchor, ice threshold (None = normal)
P=[('青L(左上)','blue',None,[(0,0),(0,1),(0,2),(1,2)],(0,0)),
   ('赤[中黄](上)','red','yellow',H,(0,3)),
   ('オレンジ(上)','orange',None,H,(0,5)),
   ('赤(右上)','red',None,[(0,0)],(0,7)),
   ('水色(上)','cyan',None,H,(1,3)),
   ('ピンク(上)','pink',None,[(0,0)],(1,5)),
   ('オレンジ(左)','orange',None,H,(4,0)),
   ('水色(左)','cyan',None,H,(5,0)),
   ('ピンク[中青](左)','pink','blue',H,(6,0)),
   ('青L[中オレンジ](左下)','blue','orange',[(0,0),(1,0),(1,1)],(7,1)),
   ('黄(下)','yellow',None,Vt,(8,3)),
   ('赤(下)','red',None,Vt,(8,4)),
   ('黄L[中水色](右下)','yellow','cyan',[(0,1),(1,1),(2,1),(2,0)],(7,5)),
   ('オレンジ(右下)','orange',None,[(0,0)],(9,7)),
   ('オレンジ[中ピンク](右)','orange','pink',H,(5,6)),
   ('ピンク[中黄](右)','pink','yellow',H,(6,6))]
ICE={(3,2),(3,3),(4,2),(3,4),(4,3),(4,4),(5,3),(5,4),(6,3),(6,4)}
V={'上':(-1,0),'下':(1,0),'左':(0,-1),'右':(0,1)}
inb=lambda r,c:0<=r<R and 0<=c<C
def solve(goal_exits=3, cap=3_000_000):
    start=(tuple(p[4] for p in P), tuple(0 for _ in P), 0)
    seen={start:None}; q=deque([start])
    while q:
        st=q.popleft(); pos,peel,ex=st
        if ex>=goal_exits:
            path=[]; s=st
            while seen[s]: s,m=seen[s]; path.append(m)
            return path[::-1], len(seen)
        if len(seen)>cap: return None,len(seen)
        occ=set(WALL)|ICE
        own={}
        for i,p in enumerate(pos):
            if p is None: continue
            for dr,dc in P[i][3]: own[(p[0]+dr,p[1]+dc)]=i
        for i,p in enumerate(pos):
            if p is None: continue
            col = P[i][2] if peel[i] else P[i][1]
            layered = P[i][2] is not None and not peel[i]
            for dn,(vr,vc) in V.items():
                k=0; last_inside=0
                while True:
                    k+=1; ok=True; out=0
                    for dr,dc in P[i][3]:
                        r,c=p[0]+dr+vr*k,p[1]+dc+vc*k
                        if inb(r,c):
                            if (r,c) in occ or own.get((r,c),i)!=i: ok=False;break
                        else:
                            # first outside cell along this line must be a matching gate
                            rr,cc=r,c
                            while not inb(rr-vr,cc-vc): rr,cc=rr-vr,cc-vc
                            if GATE.get((rr,cc))!=col: ok=False;break
                            out+=1
                    if not ok: break
                    n=len(P[i][3])
                    if out==0:
                        last_inside=k
                        npos=list(pos); npos[i]=(p[0]+vr*k,p[1]+vc*k)
                        ns=(tuple(npos),peel,ex); mv=(P[i][0],dn,k,'')
                    elif out==n:
                        npos=list(pos); npeel=list(peel)
                        if layered:
                            npos[i]=(p[0]+vr*last_inside,p[1]+vc*last_inside); npeel[i]=1
                            ns=(tuple(npos),tuple(npeel),ex); mv=(P[i][0],dn,k,'→ 外側がはがれる')
                        else:
                            npos[i]=None; ns=(tuple(npos),peel,ex+1); mv=(P[i][0],dn,k,'→ 脱出')
                    else:
                        continue
                    if ns not in seen: seen[ns]=(st,mv); q.append(ns)
                    if out==n: break
    return None,len(seen)
if __name__=='__main__':
    import sys
    path,n=solve(int(sys.argv[1]) if len(sys.argv)>1 else 3)
    print('states',n)
    if path:
        print(len(path),'moves')
        for m in path: print(' ',*m)
