"""Runner must reject remote destinations before any psql side effect."""
import os,subprocess,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class PracticeConnection(unittest.TestCase):
 def test_remote_destination_is_rejected_before_psql(self):
  with tempfile.TemporaryDirectory()as d:
   p=Path(d);marker=p/'called';exe=p/'psql'
   exe.write_text('#!/bin/sh\nprintf called >> "'+str(marker)+'"\nexit 0\n');exe.chmod(0o755)
   env={**os.environ,'PATH':d+os.pathsep+os.environ.get('PATH',''),'ACE_FCB02_DISPOSABLE_TEST':'1','PGHOST':'remote.example.invalid','PGDATABASE':'fcb02_review_test','PGUSER':'postgres'}
   r=subprocess.run(['python3','tests/sql/fcb02_2026_practice.py'],cwd=ROOT,env=env,text=True,capture_output=True,timeout=10)
   self.assertFalse(marker.exists(),'Runner invoked psql for an unapproved remote destination')
   self.assertNotEqual(r.returncode,0)
   self.assertIn('Only local',r.stderr)
if __name__=='__main__':unittest.main()
