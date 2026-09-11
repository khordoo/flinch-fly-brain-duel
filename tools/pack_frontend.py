"""Package existing verified evidence. Never reruns or tunes the neural model."""
import csv, gzip, hashlib, json, shutil, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'public/data/flinch'; (out/'traces').mkdir(parents=True,exist_ok=True)
bank=json.loads((root/'data/trials/feasibility-v1.json').read_text())
rows=list(csv.DictReader((root/'evidence/feasibility.csv').open()))
trials={t['id']:t for t in bank['trials']}
pairs=[]
for row in rows:
    if row['fixture_role']!='hit' or row['condition']!='baseline': continue
    name=Path(row['trace_file']).name
    names=[name,name.replace('baseline','sensory_outputs_silenced')]
    hashes=[]
    for name in names:
        raw=(root/'evidence/traces'/name).read_bytes()
        (out/'traces'/name).write_bytes(raw)
        hashes.append(hashlib.sha256(raw).hexdigest())
    pairs.append({'id':row['trial_id'],'seed':int(row['seed']),'trial':trials[row['trial_id']], 'trialHash':row['trial_hash'],'files':names,'sha256':hashes})
positions=[]
with gzip.open(root/'evidence/traces/brain-soma.csv.gz','rt') as f:
    for row in csv.DictReader(f): positions.append([float(row[a]) for a in ('x_voxel','y_voxel','z_voxel')])
mid=[(min(p[i] for p in positions)+max(p[i] for p in positions))/2 for i in range(3)]
extent=max(max(p[i] for p in positions)-min(p[i] for p in positions) for i in range(3))
with (out/'soma.bin').open('wb') as f:
    for p in positions: f.write(struct.pack('<fff',*((p[i]-mid[i])/extent for i in range(3))))
manifest={'version':1,'pairs':pairs,'parameters':json.loads((root/'evidence/parameters.json').read_text()),'gameplay':json.loads((root/'data/gameplay-v1.json').read_text()),'soma':{'count':len(positions),'sha256':hashlib.sha256((out/'soma.bin').read_bytes()).hexdigest(),'transform':{'centerVoxel':mid,'uniformDivisor':extent,'axisOrder':'x,y,z'}}}
(out/'catalog.json').write_text(json.dumps(manifest,separators=(',',':')))
print(f'Packed {len(pairs)} matched pairs and {len(positions)} sourced soma positions.')
