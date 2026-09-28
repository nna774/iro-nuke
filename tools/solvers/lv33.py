from collections import deque
import itertools
# 7 rows x 5 cols (A..E). Open cells read from the screenshot.
OPEN={(0,2),(1,1),(1,2),(1,3)}|{(2,c) for c in range(5)}|{(3,0),(3,1),(3,3),(3,4)}|{(4,c) for c in range(5)}|{(5,1),(5,2),(5,3),(6,2)}
GATES={(-1,2):'red',(7,2):'blue',(3,-1):'pink',(3,5):'orange'}
V={'up':(-1,0),'down':(1,0),'left':(0,-1),'right':(0,1)}
def pieces(ice1,ice3):
    return [('orange',[(0,0),(0,1)],(1,1),0,'オレンジ横長'),
            ('pink',[(0,0)],(1,3),0,'ピンク(上)'),
            ('blue',[(0,0),(1,0)],(2,3),0,'青(上)'),
            ('blue',[(0,0),(1,0)],(4,3),0,'青(下)'),
            ('red',[(0,0),(1,0)],(5,2),0,'赤'),
            ('pink',[(0,0)],(4,4),0,'ピンク(右)'),
            (ice1,[(0,0),(1,0)],(2,4),1,'氷1'),
            (ice3,[(0,0),(0,1)],(4,0),3,'氷3')]
def solve(P):
    start=(tuple(p[2] for p in P),0)
    seen={start:None}; q=deque([start])
    while q:
        st=q.popleft(); pos,ex=st
        if all(x is None for x in pos): 
            path=[];s=st
            while seen[s]: s,mv=seen[s]; path.append(mv)
            return path[::-1]
        occ={}
        for i,p in enumerate(pos):
            if p is None: continue
            for dr,dc in P[i][1]: occ[(p[0]+dr,p[1]+dc)]=i
        for i,p in enumerate(pos):
            if p is None or ex<P[i][3]: continue
            for d,(vr,vc) in V.items():
                k=0
                while True:
                    k+=1; cells=[(p[0]+dr+vr*k,p[1]+dc+vc*k) for dr,dc in P[i][1]]
                    ok=True; out=0
                    for c in cells:
                        if c in OPEN:
                            if occ.get(c,i)!=i: ok=False
                        else:
                            # left the board: must have passed through a matching gate
                            prev=(c[0]-vr,c[1]-vc); r=c
                            # walk back to first outside cell along the line
                            while (r[0]-vr,r[1]-vc) not in OPEN and 0<=r[0]-vr+1<=8: r=(r[0]-vr,r[1]-vc)
                            if GATES.get(r)!=P[i][0] or (r[0]-vr,r[1]-vc) not in OPEN: ok=False
                            else: out+=1
                    if not ok: break
                    npos=list(pos)
                    if out==len(cells):
                        npos[i]=None; ns=(tuple(npos),min(ex+1,3))
                    elif out==0:
                        npos[i]=(p[0]+vr*k,p[1]+vc*k); ns=(tuple(npos),ex)
                    else: continue
                    if ns not in seen: seen[ns]=(st,(P[i][4],d,k,out==len(cells))); q.append(ns)
                    if out==len(cells): break
    return None
for i1,i3 in itertools.product(['red','blue'],['pink','orange']):
    P=pieces(i1,i3); s=solve(P)
    print(f'氷1={i1} 氷3={i3}:', 'unsolvable' if s is None else f'{len(s)} moves')
    if s:
        for m in s: print('  ',m[0],m[1],m[2],'マス','→ 脱出' if m[3] else '')
