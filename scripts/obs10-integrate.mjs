import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
if (branch !== 'feat/obs10-preconsulta-faixa-etaria') throw new Error('OBS-10 branch required');
const path = 'client/src/pages/pre-consulta-obs10.tsx';
let source = readFileSync(path, 'utf8');
if (!source.includes('const stopRecording = media.stop;')) {
  const edits = [
    ['  const media = useLocalRecorder();', '  const media = useLocalRecorder();\n  const stopRecording = media.stop;'],
    ['    media.stop();\n    setEndReason(reason);', '    stopRecording();\n    setEndReason(reason);'],
    ['[media.stop, nowSecond]', '[stopRecording, nowSecond]'],
  ];
  for (const [from, to] of edits) {
    if (!source.includes(from)) throw new Error('Missing exact callback anchor');
    source = source.replace(from, to);
  }
}
source = source.replace('emptyObservation(String(++sequence.current), step, nowSecond())', 'emptyObservation(String(++sequence.current), step, running ? nowSecond() : elapsed)');
writeFileSync(path, source);
console.log('OBS-10 callback and post-session timestamp corrected; checks remain mandatory.');
