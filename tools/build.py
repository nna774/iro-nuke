# Embed levels/levels.json into game/template.html -> game/index.html
import json,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t=open(os.path.join(root,'game','template.html')).read()
L=json.load(open(os.path.join(root,'levels','levels.json')))
open(os.path.join(root,'game','index.html'),'w').write(t.replace('__LEVELS__',json.dumps(L,separators=(',',':'))))
print('built game/index.html with',len(L),'stages')
