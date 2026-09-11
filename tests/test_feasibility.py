import csv
import gzip
import json
import math
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def closest_distance(p, v, lo, hi):
    vv = sum(x*x for x in v)
    t = lo if vv == 0 else max(lo, min(hi, -sum(p[i]*v[i] for i in range(3))/vv))
    return math.sqrt(sum((p[i]+v[i]*t)**2 for i in range(3)))

def dodge_clearance(trial, body_radius, start_ms, distance=.03, duration_ms=120):
    o = trial["object"]; p0=o["position"]; ov=o["velocity"]
    sign = -1 if p0[0] > 0 else 1
    start=(start_ms-trial["onsetMs"])/1000; end=start+duration_ms/1000
    horizon=(trial["durationMs"]-trial["onsetMs"])/1000
    radius=body_radius+o["radius"]
    minimum=float("inf")
    # Before dodge: relative object position and velocity.
    minimum=min(minimum, closest_distance(p0, ov, 0, min(start,horizon)))
    # During dodge: body velocity subtracts from object velocity.
    bp=sign*distance/(duration_ms/1000)
    at_start=[p0[i]+ov[i]*start for i in range(3)]
    rv=[ov[0]-bp,ov[1],ov[2]]
    minimum=min(minimum, closest_distance(at_start,rv,0,max(0,min(end,horizon)-start)))
    # After dodge: body holds final X.
    if end < horizon:
        at_end=[p0[i]+ov[i]*end for i in range(3)]; at_end[0]-=sign*distance
        minimum=min(minimum, closest_distance(at_end,ov,0,horizon-end))
    return minimum-radius

class FeasibilityEvidenceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank=json.loads((ROOT/"data/trials/feasibility-v1.json").read_text())
        with (ROOT/"evidence/feasibility.csv").open() as f:
            cls.rows=list(csv.DictReader(f))

    def test_complete_paired_bank_and_nulls(self):
        self.assertEqual(100,len(self.rows))
        keys={(r["trial_id"],r["seed"],r["condition"]) for r in self.rows}
        self.assertEqual(100,len(keys))
        self.assertTrue(any(r["first_escape_sim_ms"] == "" for r in self.rows))
        fixture_text=(ROOT/"data/trials/feasibility-v1.json").read_text()
        adapter_text=(ROOT/"adapter/src/com/fruitfly/flinch/FlinchTraceAdapter.java").read_text()
        for forbidden in ('"isHit"','"truth"','"correctAction"','"score"'):
            self.assertNotIn(forbidden,fixture_text)
            self.assertNotIn(forbidden,adapter_text)

    def test_intervention_preserves_sensory_spikes_and_blocks_transmission(self):
        rows=[r for r in self.rows if r["condition"]=="sensory_outputs_silenced"]
        self.assertGreater(sum(int(r["lc4_spikes"])+int(r["lplc2_spikes"]) for r in rows),0)
        trace=json.loads((ROOT/rows[0]["trace_file"]).read_text())
        self.assertIn("outgoing synaptic transmission suppressed",trace["intervention"]["mechanism"])
        self.assertGreater(len(trace["intervention"]["neuronIds"]),0)

    def test_frozen_deadline_dodge_avoids_all_hit_fixtures(self):
        body=self.bank["bodyRadius"]
        hits=[]
        for t in self.bank["trials"]:
            clearance=closest_distance(t["object"]["position"],t["object"]["velocity"],0,(t["durationMs"]-t["onsetMs"])/1000)-(body+t["object"]["radius"])
            if clearance <= 1e-12 and sum(x*x for x in t["object"]["velocity"])>0: hits.append(t)
        self.assertEqual(4,len(hits))
        for t in hits: self.assertGreater(dodge_clearance(t,body,t["onsetMs"]+400),0)

    def test_soma_renderer_data_is_sourced(self):
        with gzip.open(ROOT/"evidence/traces/brain-soma.csv.gz","rt") as f:
            self.assertEqual("body_id,x_voxel,y_voxel,z_voxel,type",f.readline().strip())
            self.assertTrue(f.readline().strip())

if __name__ == "__main__": unittest.main()
