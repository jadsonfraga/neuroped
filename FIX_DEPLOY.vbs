Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strDir = "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"
strLog = strDir & "\fix_deploy_result.txt"

Set objFile = objFSO.CreateTextFile(strLog, True)
objFile.WriteLine "=== NeuroPed Fix Deploy - " & Now() & " ==="
objFile.Close

Function RunCmd(cmd)
    Dim strCmd
    strCmd = "cmd /c cd /d """ & strDir & """ && " & cmd & " >> """ & strLog & """ 2>&1"
    objShell.Run strCmd, 0, True
End Function

Call RunCmd("git add .github/workflows/deploy.yml")
Call RunCmd("echo === STATUS === >> """ & strLog & """")
Call RunCmd("git status --short")
Call RunCmd("git commit -m ""fix: skip playwright download + use vite build only for GitHub Pages CI""")
Call RunCmd("echo === LOG === >> """ & strLog & """")
Call RunCmd("git log --oneline -3")
Call RunCmd("git push origin feat/auditoria-total-ui-backend-memoria")

' Ler resultado
Dim objReadFile, strResult
Set objReadFile = objFSO.OpenTextFile(strLog, 1)
strResult = objReadFile.ReadAll()
objReadFile.Close

MsgBox "Resultado:" & Chr(10) & Chr(10) & strResult, 64, "NeuroPed Fix Deploy"
