"""Scan tracked current/history text without printing credential values."""
import json,re,subprocess,sys
from pathlib import Path
repo=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
patterns={
 'private signing key':re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----\s*[A-Za-z0-9+/\r\n=]{80,}'),
 'Google service-account private key':re.compile(rb'"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----'),
 'GitHub access token':re.compile(rb'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{60,})\b'),
 'issued BancyCraft key':re.compile(rb'\bBC1\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{86}\b'),
 'Discord bot credential':re.compile(rb'\b(?:MTA|MTE|MTI|MTM|MTQ|MTU)[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b'),
}
objects=subprocess.check_output(['git','rev-list','--objects','--all'],cwd=repo).decode().splitlines()
paths={line.split(' ',1)[0]:line.split(' ',1)[1] for line in objects if ' ' in line}
text_extensions={'.cjs','.mjs','.js','.ts','.tsx','.json','.md','.yml','.yaml','.toml','.txt','.pem','.env','.html','.py','.sh','.ps1','.config'}
ids=[oid for oid,name in paths.items() if Path(name).suffix.lower() in text_extensions or any(x in name.lower() for x in ['secret','credential','.env','private','password'])]
process=subprocess.Popen(['git','cat-file','--batch'],cwd=repo,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
findings=[];scanned=0
for oid in ids:
 process.stdin.write((oid+'\n').encode());process.stdin.flush()
 header=process.stdout.readline().decode().split()
 if len(header)!=3:continue
 size=int(header[2]);value=process.stdout.read(size);process.stdout.read(1)
 if header[1]!='blob' or b'\0' in value:continue
 scanned+=1
 for label,pattern in patterns.items():
  if pattern.search(value):findings.append({'path':paths[oid],'object':oid,'type':label})
process.stdin.close();process.wait()
current=0
for name in subprocess.check_output(['git','ls-files','-co','--exclude-standard','-z'],cwd=repo).decode().split('\0'):
 if not name:continue
 file=repo/name
 if file.suffix.lower() not in text_extensions or not file.is_file():continue
 value=file.read_bytes()
 if b'\0' in value:continue
 current+=1
 for label,pattern in patterns.items():
  if pattern.search(value):findings.append({'path':name,'object':'working tree','type':label})
report={'workingTextFilesChecked':current,'repository':repo.name,'historyTextBlobsChecked':scanned,'findings':findings,'note':'Public Firebase web configuration and public verification keys are intentionally public. No credential values are printed.'}
print(json.dumps(report,indent=2));sys.exit(1 if findings else 0)
