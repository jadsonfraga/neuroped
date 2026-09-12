$ErrorActionPreference='Stop'
$Root='C:\NeuroPed'
$PantRoot='C:\Users\User\PANT'
$Repo='C:\NeuroPed\_work\sonda10_refino_20260908'
$OutDir=Join-Path $Root 'WeeklyRecap'
$StatePath=Join-Path $OutDir 'latest.json'
$MdPath=Join-Path $OutDir 'latest.md'
$Now=Get-Date
$Since=$Now.AddDays(-7)
New-Item -ItemType Directory -Force $OutDir | Out-Null
function ReadJson([string]$Path){
  if(Test-Path $Path){ try { return (Get-Content $Path -Raw | ConvertFrom-Json) } catch { return $null } }
  return $null
}
function LatestPdfMeta([string]$Path,[string]$Family='PANT'){
  if(!(Test-Path -LiteralPath $Path)){ return [ordered]@{count=$null;changed_in_window=$null;latest_utc=$null;status='NOT_VERIFIED';coverage='LOCAL_FOLDER_ONLY'} }
  try {
    $all=@(Get-ChildItem -LiteralPath $Path -File -Filter '*.pdf' -ErrorAction Stop)
    $f=@($all | Where-Object {
      $isPre=$_.BaseName -match '(?i)PRE[ _-]*PANT'
      $isPanty=$_.BaseName -match '(?i)(^|[^A-Z])PANTY([^A-Z]|$)'
      !$isPre -and (($Family -eq 'PANTY' -and $isPanty) -or ($Family -eq 'PANT' -and !$isPanty))
    })
    $latest=$f | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    $changed=@($f | Where-Object { $_.LastWriteTimeUtc -ge $Since.ToUniversalTime() -or $_.CreationTimeUtc -ge $Since.ToUniversalTime() })
    return [ordered]@{count=$f.Count;changed_in_window=$changed.Count;latest_utc=$(if($latest){$latest.LastWriteTimeUtc.ToString('o')}else{$null});status='VERIFIED_LOCAL';coverage='LOCAL_FOLDER_ONLY'}
  } catch {
    return [ordered]@{count=$null;changed_in_window=$null;latest_utc=$null;status='NOT_VERIFIED';coverage='LOCAL_FOLDER_ONLY'}
  }
}
$R=[ordered]@{
  schema='neuroped.weekly-recap.snapshot.v1'
  generated_at_utc=[DateTime]::UtcNow.ToString('o')
  window_start_utc=$Since.ToUniversalTime().ToString('o')
  machine=[Environment]::MachineName
}
$PantCheck=$null
try {
  $env:PYTHONHOME=Join-Path $PantRoot 'runtime'
  $env:PYTHONPATH=''
  $env:PYTHONUTF8='1'
  $raw=& (Join-Path $PantRoot 'runtime\python.exe') -B -X utf8 (Join-Path $PantRoot 'pant_local.py') verificar 2>&1 | Out-String
  $i=$raw.IndexOf('{')
  if($i -ge 0){ $PantCheck=$raw.Substring($i) | ConvertFrom-Json }
} catch { $PantCheck=[pscustomobject]@{pronto=$false;bloqueios=@($_.Exception.Message)} }
$CurrentLocal=ReadJson (Join-Path $PantRoot 'CURRENT_LOCAL.json')
$CurrentVisual=ReadJson (Join-Path $PantRoot '00_CURRENT_PANT_VISUAL.json')
$LiveProof=ReadJson 'C:\Users\User\AppData\Local\NeuroPed\PANT_STATE\LIVE_CURRENT_PROOF.json'
$R.pant=[ordered]@{
  ready=$(if($PantCheck){[bool]$PantCheck.pronto}else{$false})
  blockers=$(if($PantCheck -and $PantCheck.bloqueios){@($PantCheck.bloqueios)}else{@()})
  seal=$(if($PantCheck){$PantCheck.selo}else{$null})
  current_revision=$(if($CurrentLocal){$CurrentLocal.revision}else{$null})
  current_motor_sha256=$(if($CurrentLocal){$CurrentLocal.motor_sha256}else{$null})
  visual_profile=$(if($CurrentVisual){$CurrentVisual.profile}else{$null})
  live_current_verified=$(if($PantCheck){[bool]$PantCheck.current_live_verified}else{$false})
  live_current_sha256=$(if($LiveProof){$LiveProof.live_current_sha256}else{$null})
  outputs=LatestPdfMeta (Join-Path $PantRoot 'PANT_OUT')
  review_queue=LatestPdfMeta (Join-Path $PantRoot 'revisao')
}
$R.panty=[ordered]@{
  status='PARTIAL_LOCAL'
  outputs=LatestPdfMeta (Join-Path $PantRoot 'PANT_OUT') 'PANTY'
  review_queue=LatestPdfMeta (Join-Path $PantRoot 'revisao') 'PANTY'
  total_drive_count=$null
  drive_status='EXTERNAL_AT_RECAP_TIME'
  coverage='Only the two local PANT folders; not a complete Drive inventory'
  classification='PANTY filename token; PRE-PANT/PRE-PANTY excluded; no double counting with PANT'
}
$R.document_observability=[ordered]@{
  version='1.1'
  source='LOCAL_FILESYSTEM_METADATA'
  collected_at_utc=[DateTime]::UtcNow.ToString('o')
  window_end_utc=$Now.ToUniversalTime().ToString('o')
  deduplication='Unique file per local folder; do not sum local and Drive counts'
  limitations='Zero local matches does not mean zero PANTY in Drive. Modification times do not prove approval or delivery.'
}
$Git=[ordered]@{present=(Test-Path (Join-Path $Repo '.git'))}
if($Git.present){
  $Git.branch=(& git -C $Repo branch --show-current 2>$null | Out-String).Trim()
  $Git.head=(& git -C $Repo rev-parse HEAD 2>$null | Out-String).Trim()
  $status=@(& git -C $Repo status --porcelain 2>$null)
  $Git.dirty_total=$status.Count
  $Git.dirty_relevant=@($status | Where-Object {$_ -notmatch '__pycache__'}).Count
  $log=@(& git -C $Repo log --since='7 days ago' --pretty=format:'%H|%ad|%s' --date=iso-strict -n 30 2>$null)
  $Git.recent_commits=@($log)
}else{
  $Git.branch=$null; $Git.head=$null; $Git.dirty_total=0; $Git.dirty_relevant=0; $Git.recent_commits=@()
}
$R.git=$Git
$BootStatus=ReadJson (Join-Path $Root '_audit\pcdrjadson_status.json')
$NonReady=@()
if($BootStatus -and $BootStatus.non_ready){ $NonReady=@($BootStatus.non_ready | ForEach-Object { [ordered]@{name=$_.name;status=$_.status} }) }
$R.infrastructure=[ordered]@{
  desktop_commander='ONLINE_AT_SNAPSHOT'
  google_drive_mount=$(if(Test-Path 'G:\'){'READY'}else{'AUTH_REQUIRED'})
  rclone_oauth=$(if(Test-Path 'C:\Users\User\AppData\Roaming\rclone\rclone.conf'){'READY'}else{'AUTH_REQUIRED'})
  stale_bootstrap_non_ready=$NonReady
}
$R.sources=[ordered]@{
  chatgpt='EXTERNAL_AT_RECAP_TIME'
  google_drive='EXTERNAL_OR_G_DRIVE_IF_AUTHENTICATED'
  github='LOCAL_SNAPSHOT_PLUS_EXTERNAL_AT_RECAP_TIME'
  automations='CHATGPT_AUTOMATION_EXTERNAL_PLUS_LOCAL_TASK'
}
$R.privacy=[ordered]@{
  patient_names_included=$false
  clinical_text_included=$false
  purpose='technical weekly recap support only'
}
$Json=$R | ConvertTo-Json -Depth 10
[IO.File]::WriteAllText($StatePath,$Json+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
$Lines=@()
$Lines += '# NeuroPed SDG — snapshot semanal técnico'
$Lines += ''
$Lines += ('Gerado: '+$Now.ToString('yyyy-MM-dd HH:mm:ss'))
$Lines += ('PANT pronto: '+$R.pant.ready+' | live CURRENT verificado: '+$R.pant.live_current_verified)
$Lines += ('PANT saída/revisão: '+$R.pant.outputs.count+' / '+$R.pant.review_queue.count+' PDFs')
$Lines += ('PANTY local saida/revisao: '+$R.panty.outputs.count+' / '+$R.panty.review_queue.count+' PDFs | cobertura parcial; total Drive NAO VERIFICADO')
$Lines += ('Git: '+$R.git.branch+' @ '+$R.git.head+' | dirty relevante: '+$R.git.dirty_relevant)
$Lines += ('Google Drive: '+$R.infrastructure.google_drive_mount+' | rclone OAuth: '+$R.infrastructure.rclone_oauth)
$Lines += ''
$Lines += 'Sem nomes de pacientes ou texto clínico. ChatGPT/Drive/GitHub remoto devem ser consultados no recap de sexta.'
[IO.File]::WriteAllLines($MdPath,$Lines,[Text.UTF8Encoding]::new($false))
Write-Output $StatePath
Write-Output $MdPath